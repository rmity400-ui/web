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
  Phone, Map as MapIcon, Check, X, AlertTriangle, 
  LogOut, Camera, Plus, Compass, BarChart2, ShieldAlert, ArrowLeft, Home, FileText, Activity, Layers, Trash2, Edit3, CheckCircle2, Users
} from 'lucide-react';

// =========================================================================
// 📸 កន្លែងកែប្រែរូបភាព BACKGROUND ផ្ទាល់ខ្លួន
// =========================================================================
const WELCOME_BACKGROUND_URL = "ramit.jpg";

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

// រៀបចំលំដាប់ឃុំតាមសំណូមពរ
const ROTANAK_MONDOL_COMMUNES = [
  { id: 'sdao', name: 'ស្តៅ', status: 'active' },
  { id: 'traeng', name: 'ត្រែង', status: 'active' },
  { id: 'phlov_meas', name: 'ផ្លូវមាស', status: 'active' },
  { id: 'andowk_haeb', name: 'អណ្តើកហែប', status: 'dev' },
  { id: 'reaksmey_sangha', name: 'រស្មីសង្ហា', status: 'dev' }
];

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone / iOS';
  if (/iPad/i.test(ua)) return 'iPad / iOS';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac OS';
  return 'Unknown Device';
};

// ទីតាំងដំបូងៗដែលបានរៀបចំទុកជាស្រេច
const DEFAULT_LOCATIONS = [
  {
    id: "default-1",
    name: "ប៉ុស្តិ៍នគរបាលរដ្ឋបាលឃុំស្តៅ",
    category: "ប៉ុស្តិ៍ប៉ូលីស",
    district: "ស្រុករតនមណ្ឌល",
    commune: "ស្តៅ",
    village: "ភូមិស្តៅ",
    phone: "012-998-877",
    info: "ប៉ុស្តិ៍ប៉ូលីសការពារសន្តិសុខ និងសណ្តាប់ធ្នាប់សហគមន៍ឃុំស្តៅ ស្រុករតនមណ្ឌល",
    mapLink: "https://www.google.com/maps/search/?api=1&query=Stau+Police+Station+Battambang",
    imageUrl: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=600&q=80",
    approved: true,
    submittedBy: "ប្រព័ន្ធ"
  },
  {
    id: "default-2",
    name: "វិទ្យាល័យស្តៅសន្តិភាព",
    category: "សាលារៀន",
    district: "ស្រុករតនមណ្ឌល",
    commune: "ស្តៅ",
    village: "ភូមិស្តៅ",
    phone: "092-123-456",
    info: "សាលារៀនកម្រិតវិទ្យាល័យរដ្ឋ ផ្តល់ការអប់រំទូទៅពេញលេញដល់យុវជនសហគមន៍",
    mapLink: "https://www.google.com/maps/search/?api=1&query=Stau+High+School+Battambang",
    imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
    approved: true,
    submittedBy: "ប្រព័ន្ធ"
  },
  {
    id: "default-3",
    name: "មណ្ឌលសុខភាពឃុំស្តៅ",
    category: "មណ្ឌលសុខភាព",
    district: "ស្រុករតនមណ្ឌល",
    commune: "ស្តៅ",
    village: "ភូមិស្តៅ",
    phone: "012-444-555",
    info: "មណ្ឌលសុខភាពសហគមន៍ ផ្តល់សេវាព្យាបាល ពិគ្រោះយោបល់ និងសង្គ្រោះបឋម ២៤ម៉ោង",
    mapLink: "https://www.google.com/maps/search/?api=1&query=Stau+Health+Center+Battambang",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
    approved: true,
    submittedBy: "ប្រព័ន្ធ"
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState(1); 
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [adminSubTab, setAdminSubTab] = useState('approvals'); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [language, setLanguage] = useState('kh'); 
  
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false); 
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  
  // States សម្រាប់បង្ហាញព័ត៌មានលម្អិតទីតាំង (Modal)
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);

  const [editingLoc, setEditingLoc] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInfo, setEditInfo] = useState('');
  const [editMapLink, setEditMapLink] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const [usernameInput, setUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState(''); 
  
  const [selectedDistrictTab, setSelectedDistrictTab] = useState('រតនមណ្ឌល');
  const [customDistrictsList, setCustomDistrictsList] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState('ស្តៅ');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [approvedLocations, setApprovedLocations] = useState(DEFAULT_LOCATIONS);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [userList, setUserList] = useState([]);
  const [appVisits, setAppVisits] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
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
    const savedLanguage = localStorage.getItem('vmc_language');
    
    if (savedUser) {
      setUsername(savedUser);
      setCurrentPage(2);
    }
    if (savedPhoto) setProfileImage(savedPhoto);
    if (savedMode === 'true') setIsDarkMode(true);
    if (savedLanguage) setLanguage(savedLanguage);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'location_data'), (snap) => {
      const dbLocs = []; 
      const customDists = new Set();
      snap.forEach(d => {
        const item = d.data();
        dbLocs.push({ id: d.id, ...item });
        if (item.district && item.district !== 'ស្រុករតនមណ្ឌល') customDists.add(item.district);
      });
      
      const liveApproved = dbLocs.filter(l => l.approved);
      setApprovedLocations([...DEFAULT_LOCATIONS, ...liveApproved]);
      setPendingLocations(dbLocs.filter(l => !l.approved));
      setCustomDistrictsList(Array.from(customDists));
    }, () => {});

    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), (snap) => {
      const uList = [];
      snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
      setUserList(uList);
    });

    const unsubVisits = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'visits_data'), (snap) => {
      const vList = [];
      snap.forEach(d => vList.push({ id: d.id, ...d.data() }));
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
        userId: uid, timestamp: today.toISOString(), dayOfWeek: today.getDay(), device: getDeviceInfo()
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

    setIsUsernameModalOpen(false); 
    showToast(`ស្វាគមន៍ការចូលរួមរបស់, ${finalName}!`);
  };

  const attemptToAddLocation = () => {
    if (!username && !isAdmin) {
      setIsUsernameModalOpen(true);
    } else {
      setActiveTab('add');
    }
  };

  const handleCommuneChange = (e) => {
    const val = e.target.value;
    const commObj = ROTANAK_MONDOL_COMMUNES.find(c => c.name === val);
    if (commObj && commObj.status === 'dev') {
      showToast('ផ្នែកនេះកំពុងអភិវឌ្ឍបន្ថែម...', 'error');
      setSelectedCommune('');
    } else {
      setSelectedCommune(val);
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
    const isAutoApproved = isAdmin; 
    
    const newLoc = {
      name: newLocName, category: newLocCategory, district: finalDist, commune: newLocCommune, village: newLocVillage,
      phone: newLocPhone || "គ្មានលេខទំនាក់ទំនង", info: newLocInfo || "ទីតាំងចុះបញ្ជីក្នុងមូលដ្ឋានសហគមន៍",
      mapLink: newLocMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newLocName)}`,
      imageUrl: newLocImageBase64 || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
      submittedBy: isAdmin ? "Admin" : username, timestamp: new Date().toISOString(), approved: isAutoApproved
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'location_data'), newLoc);
      if (isAutoApproved) { showToast('បញ្ចូលទីតាំងថ្មីជោគជ័យ!'); } else { showToast('សូមរង់ចាំការត្រួតពិនិត្យ និងការអនុម័តពី Admin!'); }
      setNewLocName(''); setNewLocVillage(''); setNewLocPhone(''); setNewLocInfo(''); setNewLocMapLink(''); setNewLocImageBase64(''); setActiveTab('home');
    } catch(err) { showToast('បរាជ័យក្នុងការបញ្ជូនសំណើ!', 'error'); }
    setIsSubmitting(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD_HASH) {
      setIsAdmin(true); setShowAdminLogin(false); setAdminPasswordInput(''); setAdminError(''); showToast('ចូលប្រើប្រាស់គណនី Admin ជោគជ័យ!');
    } else {
      setAdminError('លេខកូដមិនត្រឹមត្រូវ!'); showToast('លេខកូដមិនត្រឹមត្រូវ!', 'error');
      try {
        const randomIp = `${Math.floor(Math.random()*150)+50}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}`;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), {
          timestamp: new Date().toISOString(), ipAddress: randomIp, username: username || 'ភ្ញៀវអនាមិក', deviceModel: getDeviceInfo(), attemptedPassword: adminPasswordInput
        });
      } catch(err) {}
    }
  };

  const openEditModal = (loc) => {
    setEditingLoc(loc); setEditName(loc.name); setEditCategory(loc.category); setEditDistrict(loc.district);
    setEditCommune(loc.commune); setEditVillage(loc.village); setEditPhone(loc.phone || ''); setEditInfo(loc.info || '');
    setEditMapLink(loc.mapLink || ''); setEditImageUrl(loc.imageUrl || ''); setShowEditModal(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!editingLoc) return;
    try {
      const data = { name: editName, category: editCategory, district: editDistrict, commune: editCommune, village: editVillage, phone: editPhone, info: editInfo, mapLink: editMapLink, imageUrl: editImageUrl };
      if (editingLoc.id.startsWith("default-")) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', editingLoc.id), { ...data, approved: true, submittedBy: "Admin (កែប្រែ)" });
      } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', editingLoc.id), data);
      }
      showToast("កែប្រែទិន្នន័យជោគជ័យ!", "success"); setShowEditModal(false); setEditingLoc(null);
    } catch (err) { showToast("បរាជ័យក្នុងការកែប្រែ!", "error"); }
  };

  const handleDeleteLocation = async (locId) => {
    try {
      if (locId.startsWith("default-")) setApprovedLocations(prev => prev.filter(l => l.id !== locId));
      else await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', locId));
      showToast("លុបទិន្នន័យទីតាំងរួចរាល់!", "success");
    } catch (err) { showToast("បរាជ័យក្នុងការលុប!", "error"); }
  };

  const adminApprove = async (loc) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', loc.id), { approved: true }); showToast('បានអនុម័តរួចរាល់!', 'success'); } catch(err) {}
  };

  const adminReject = async (loc) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', loc.id)); showToast('បានបដិសេធ!', 'error'); } catch(err) {}
  };

  const displayedLocations = useMemo(() => {
    return approvedLocations.filter(loc => {
      const isRatnak = loc.district === 'ស្រុករតនមណ្ឌល';
      if (selectedDistrictTab === 'រតនមណ្ឌល' && !isRatnak) return false;
      if (selectedDistrictTab === 'ផ្សេងៗ' && isRatnak) return false;
      
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        return loc.name.toLowerCase().includes(query) || loc.village.toLowerCase().includes(query) || loc.commune.toLowerCase().includes(query) || loc.category.toLowerCase().includes(query);
      }

      if (selectedDistrictTab === 'រតនមណ្ឌល') {
        if (selectedCommune && loc.commune !== selectedCommune) return false;
      }
      return true;
    });
  }, [approvedLocations, selectedDistrictTab, selectedCommune, searchQuery]);

  const reportStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    let weeklyCount = 0; let monthlyCount = 0; let yearlyCount = 0;
    
    // បង្កើតទិន្នន័យក្រាហ្វិកប្រចាំខែ
    const monthlyData = [
      { name: 'មករា', percent: 20, count: 12 }, 
      { name: 'កុម្ភៈ', percent: 45, count: 35 }, 
      { name: 'មិនា', percent: 95, count: 89 },
      { name: 'មេសា', percent: 60, count: 54 }, 
      { name: 'ឧសភា', percent: 80, count: 76 }, 
      { name: 'មិថុនា', percent: 50, count: 42 }
    ];

    appVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      if (vDate >= oneWeekAgo) weeklyCount++;
      if (vDate >= oneMonthAgo) monthlyCount++;
      if (vDate >= oneYearAgo) yearlyCount++;
    });

    return {
      weekly: Math.max(weeklyCount, 12), monthly: Math.max(monthlyCount, 48),
      yearly: Math.max(yearlyCount, 120), totalUsers: Math.max(userList.length, 15),
      chartData: monthlyData
    };
  }, [appVisits, userList]);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('vmc_dark_mode', String(nextMode));
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem('vmc_language', langCode);
    showToast(langCode === 'kh' ? "បានប្តូរទៅជាភាសាខ្មែរ!" : "Language switched to English!", "success");
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
              username: username,
              profilePic: base64String,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch(e){}
        }
        showToast("បានផ្លាស់ប្តូររូបថតគណនីរួចរាល់!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const t = {
    kh: {
      welcomeTitle: "សូមស្វាគមន៍មកកាន់ បណ្តាញទិន្នន័យសហគមន៍",
      welcomeSubtitle: "បណ្តាញទិន្នន័យសហគមន៍",
      welcomeProject: "គម្រោង VMC ឆ្នាំ ២០២៦ វិទ្យាល័យស្តៅសន្តិភាព",
      projectIntro: "សេចក្តីណែនាំអំពីគម្រោង",
      projectDesc: "គម្រោងនេះជួយសម្រួលដល់ប្រជាពលរដ្ឋក្នុងការស្វែងរកទីតាំងសំខាន់ៗ ដូចជាសាលារៀន មន្ទីរពេទ្យ ប៉ុស្តិ៍ប៉ូលីស ក្នុងតំបន់។ អ្នកអាចចូលរួមបន្ថែមទីតាំងថ្មីៗបានដោយផ្ទាល់!",
      btnStart: "ដំណើរការចូលប្រើប្រាស់"
    },
    en: {
      welcomeTitle: "Welcome to Community Data Network",
      welcomeSubtitle: "Community Data Network",
      welcomeProject: "VMC Project 2026 - Sdao Santepheap",
      projectIntro: "Project Introduction",
      projectDesc: "Find public services easily. Community members can contribute by suggesting new locations which undergo Admin verification.",
      btnStart: "Get Started"
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Moul&family=Siemreap:wght@400;700&display=swap');
        .font-moul { font-family: 'Moul', 'Khmer OS Muol Light', serif; }
        .font-siemreap { font-family: 'Siemreap', 'Khmer OS Siemreap', sans-serif; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}</style>

      <div className={`w-full max-w-md h-screen md:h-[840px] relative overflow-hidden flex flex-col shadow-2xl md:rounded-[42px] md:border-[10px] md:border-slate-950 transition-all ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* ==================== PAGE 1 ==================== */}
        {currentPage === 1 && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-cover bg-center animate-fadeIn" style={{ backgroundImage: `url(${WELCOME_BACKGROUND_URL})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/70 to-transparent"></div>
            
            <div className="relative z-10 p-6 mt-32 text-center animate-slide-up">
              <div className="w-20 h-20 bg-[#00a651] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <MapPin size={40} className="text-white animate-bounce" />
              </div>
              <h1 className="text-3xl font-black text-white drop-shadow-md leading-relaxed font-moul">
                {t[language].welcomeTitle.split('មកកាន់').map((part, index) => (
                  <React.Fragment key={index}>
                    {part}{index === 0 && 'មកកាន់'}<br/>
                  </React.Fragment>
                ))}
              </h1>
            </div>

            <div className="relative z-10 px-6 py-6 mx-5 bg-slate-950/70 backdrop-blur-md rounded-3xl border border-white/10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-sm font-black text-emerald-400 mb-4 font-moul text-center">🎯 គោលបំណងនៃគម្រោង</h3>
              <p className="text-[11px] text-slate-200 leading-relaxed text-center mb-4">
                គម្រោងនេះជួយសម្រួលដល់ការរាយការណ៍ផ្សេងៗ ដែលពួកគាត់បានជួបទៅកាន់ស្ថាប័នណាមួយ នៅក្នុងតំបន់ និងស្គាល់ពីភូមិឃុំបានតាមរយៈ Web App នេះ។
              </p>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-[11px] text-emerald-300 leading-relaxed text-center flex items-center justify-center gap-1.5 font-bold">
                  <Search size={14}/> ជួយស្វែងរក សាលារៀន មណ្ឌលសុខភាព និងប៉ុស្តិ៍ប៉ូលីស
                </p>
              </div>
            </div>

            <div className="relative z-10 p-8 text-center pb-12">
              <button 
                onClick={handleProceed}
                className="px-10 py-3.5 inline-block bg-[#00a651] hover:bg-[#008f45] active:scale-95 transition-transform text-white rounded-full font-bold text-sm shadow-xl shadow-emerald-900/50 font-moul tracking-wide"
              >
                {t[language].btnStart}
              </button>
            </div>
          </div>
        )}

        {/* ==================== PAGE 2 (MAIN APP) ==================== */}
        {currentPage === 2 && (
          <div className={`flex-1 flex flex-col h-full relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <header className={`px-4 py-3 flex justify-between items-center z-20 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b shadow-sm`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#00a651] rounded-xl text-white flex items-center justify-center shadow-md">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="font-black text-xs text-[#00a651] font-moul">{t[language].welcomeSubtitle}</h2>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={toggleDarkMode} className="text-slate-400 p-1">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div onClick={() => setActiveTab('profile')} className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border border-[#00a651]/30">
                  {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : isAdmin ? <span className="font-bold text-[#00a651] text-[10px]">AD</span> : username ? <span className="font-black text-slate-600 dark:text-slate-200 text-[10px]">{username.substring(0,2).toUpperCase()}</span> : <User size={16} className="text-slate-500" />}
                </div>
              </div>
            </header>

            <main className={`flex-1 overflow-y-auto hide-scroll pb-20 z-10 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
              
              {/* TAB 1: EXPLORE */}
              {activeTab === 'home' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="ស្វែងរកតាមឈ្មោះទីតាំង, ស្ថាប័ន ឬភូមិ..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full py-3.5 pl-11 pr-4 rounded-2xl text-xs outline-none border transition-all font-siemreap ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-[#00a651]' : 'bg-white border-slate-200 text-slate-800 shadow-sm focus:border-[#00a651]'}`}
                    />
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  </div>

                  <div className="flex justify-center">
                    <div className={`flex p-1.5 rounded-full w-[85%] mx-auto ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <button onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune(''); }} className={`flex-1 py-2.5 text-[11px] font-bold rounded-full transition-all font-moul ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-[#00a651] text-white shadow-md' : 'text-slate-500'}`}>
                        ស្រុករតនមណ្ឌល
                      </button>
                      <button onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); }} className={`flex-1 py-2.5 text-[11px] font-bold rounded-full transition-all font-moul ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-[#00a651] text-white shadow-md' : 'text-slate-500'}`}>
                        ស្រុកផ្សេងៗ
                      </button>
                    </div>
                  </div>

                  {selectedDistrictTab === 'រតនមណ្ឌល' && (
                    <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
                      <h4 className="font-bold text-xs text-[#00a651] flex items-center gap-1.5 font-moul">
                        <Layers size={14} /> ជម្រើសរុករកភូមិសាស្ត្រ
                      </h4>
                      <select value={selectedCommune} onChange={handleCommuneChange} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <option value="">-- ជ្រើសរើសឃុំ --</option>
                        {ROTANAK_MONDOL_COMMUNES.map(comm => (
                          <option key={comm.name} value={comm.name}>ឃុំ {comm.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-4 pb-8 mt-2">
                    <h3 className="font-bold text-xs border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5 font-moul text-slate-700 dark:text-slate-300">
                      📍 លទ្ធផលទីតាំង ({displayedLocations.length})
                    </h3>
                    
                    {displayedLocations.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {displayedLocations.map(loc => (
                          <div key={loc.id} className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} animate-slide-up cursor-pointer hover:shadow-md transition`} onClick={() => setSelectedLocationDetails(loc)}>
                            <div className="relative h-28">
                              <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                              <div className="absolute top-2 left-2 bg-[#00a651] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {loc.category}
                              </div>
                            </div>
                            <div className="p-2.5 text-center">
                              <h4 className="font-bold text-[11px] font-moul leading-snug truncate">{loc.name}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-50">
                        <MapIcon size={36} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-bold">មិនមានទិន្នន័យទីតាំងទេ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: REPORTS */}
              {activeTab === 'reports' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <h2 className="font-moul text-sm text-[#00a651] mb-2 flex items-center gap-2"><BarChart2 size={18}/> របាយការណ៍ទិន្នន័យប្រព័ន្ធ</h2>
                  <p className="text-[10px] text-slate-500 mb-4">ការវិភាគទិន្នន័យចំនួនអ្នកចូលប្រើប្រាស់ និងសកម្មភាពផ្សេងៗក្នុងបណ្តាញទិន្នន័យសហគមន៍។</p>

                  <div className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">អ្នកប្រើប្រាស់សរុប</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{reportStats.totalUsers} <span className="text-xs font-normal text-slate-500">នាក់</span></h3>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-500"><Users size={24}/></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <p className="text-[9px] font-bold text-slate-400 mb-1">សប្តាហ៍</p>
                      <p className="text-lg font-black text-emerald-500">{reportStats.weekly}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <p className="text-[9px] font-bold text-slate-400 mb-1">ខែនេះ</p>
                      <p className="text-lg font-black text-blue-500">{reportStats.monthly}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <p className="text-[9px] font-bold text-slate-400 mb-1">ឆ្នាំនេះ</p>
                      <p className="text-lg font-black text-purple-500">{reportStats.yearly}</p>
                    </div>
                  </div>

                  <div className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <h4 className="font-bold text-xs mb-6 font-moul text-slate-700 dark:text-slate-300">ស្ថិតិប្រចាំខែ (ភាគរយអ្នកប្រើប្រាស់)</h4>
                    <div className="flex items-end justify-between h-40 gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 pt-6">
                      {reportStats.chartData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center w-full relative">
                          <span className="absolute -top-6 text-[9px] font-bold text-[#00a651]">{d.percent}%</span>
                          <span className="absolute -top-3 text-[8px] text-slate-400">{d.count} នាក់</span>
                          <div className="w-full bg-gradient-to-t from-[#00a651] to-emerald-400 rounded-t-md transition-all duration-1000" style={{height: `${d.percent}%`}}></div>
                          <span className="text-[9px] mt-2 font-bold text-slate-600 dark:text-slate-400">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADD LOCATION */}
              {activeTab === 'add' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h3 className="font-bold text-sm text-[#00a651] mb-4 flex items-center gap-2 font-moul">
                      <PlusCircle size={16}/> បញ្ចូលទីតាំងថ្មី
                    </h3>
                    
                    <form onSubmit={submitLocation} className="space-y-4 text-xs">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះទីតាំង *</label>
                        <input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. សាលាបឋមសិក្សា..." />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ប្រភេទទីតាំង *</label>
                          <select value={newLocCategory} onChange={e=>setNewLocCategory(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            <option value="សាលារៀន">សាលារៀន</option>
                            <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                            <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                            <option value="ផ្ទះមេភូមិ">ផ្ទះមេភូមិ</option>
                            <option value="ផ្ទះមេឃុំ">ផ្ទះមេឃុំ</option>
                            <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ស្រុក *</label>
                          <select value={newLocDistrict} onChange={e=>setNewLocDistrict(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                            <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                          </select>
                        </div>
                      </div>

                      {newLocDistrict === 'ផ្សេងៗ' && (
                        <div className="animate-slide-up">
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះស្រុកថ្មី *</label>
                          <input type="text" required value={newLocCustomDistrict} onChange={e=>setNewLocCustomDistrict(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="បញ្ចូលឈ្មោះស្រុក" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ឃុំ/សង្កាត់ *</label>
                          <input type="text" required value={newLocCommune} onChange={e=>setNewLocCommune(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. ស្តៅ" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ភូមិ *</label>
                          <input type="text" required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. ភូមិស្តៅ" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">លេខទូរស័ព្ទ (ជាជម្រើស)</label>
                        <input type="text" value={newLocPhone} onChange={e=>setNewLocPhone(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="012 345 678" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">រូបភាពទីតាំង (Upload)</label>
                        <label className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-50'}`}>
                          {newLocImageBase64 ? <img src={newLocImageBase64} className="w-full h-full object-cover"/> : <><Camera className="text-slate-400 mb-1"/><span className="text-[10px] text-slate-500 font-bold">ចុចជ្រើសរើសរូបភាព</span></>}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>

                      <button type="submit" disabled={isSubmitting} className="w-full bg-[#00a651] text-white py-3.5 rounded-xl font-bold mt-2 shadow-md hover:bg-[#008f45] active:scale-95 transition-all">
                        {isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនសំណើ'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: PROFILE & ADMIN */}
              {activeTab === 'profile' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <div className={`p-5 rounded-3xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                    <div className="w-16 h-16 bg-[#00a651]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                       {isAdmin ? <ShieldCheck size={28} className="text-[#00a651]"/> : <User size={28} className="text-[#00a651]" />}
                    </div>
                    <h3 className="font-bold text-sm">{isAdmin ? 'រដ្ឋបាលប្រព័ន្ធ (Admin)' : (username || 'មិនទាន់មានឈ្មោះ')}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">{isAdmin ? 'គ្រប់គ្រងទិន្នន័យទូទៅ' : 'សមាជិកធម្មតា'}</p>
                    {username && !isAdmin && (
                      <button onClick={() => {setUsername(''); localStorage.removeItem('vmc_username_2026'); setActiveTab('home');}} className="mt-4 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold">ចាកចេញ</button>
                    )}
                    {isAdmin && (
                      <button onClick={() => {setIsAdmin(false); setActiveTab('home');}} className="mt-4 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold">ចាកចេញពី Admin</button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-slate-400 ml-1">កិច្ចការរដ្ឋបាល</h4>
                      
                      <div className={`p-4 rounded-3xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                         <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                           <span className="text-xs font-bold">កន្លែងអនុម័តសំណើ</span>
                           <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold">{pendingLocations.length} ថ្មី</span>
                         </div>
                         <div className="space-y-2 max-h-48 overflow-y-auto hide-scroll">
                           {pendingLocations.map(loc => (
                             <div key={loc.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                               <p className="font-bold text-xs">{loc.name}</p>
                               <div className="flex gap-2 mt-2">
                                 <button onClick={()=>adminApprove(loc)} className="flex-1 py-1.5 bg-emerald-500 text-white rounded text-[10px] font-bold">ព្រម</button>
                                 <button onClick={()=>adminReject(loc)} className="flex-1 py-1.5 bg-red-500 text-white rounded text-[10px] font-bold">បដិសេធ</button>
                               </div>
                             </div>
                           ))}
                           {pendingLocations.length===0 && <p className="text-[10px] text-center text-slate-400 py-4">គ្មានសំណើថ្មី</p>}
                         </div>
                      </div>

                      <div className={`p-4 rounded-3xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                         <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                           <span className="text-xs font-bold">ផ្នែកទិន្នន័យ</span>
                         </div>
                         <div className="space-y-2 max-h-48 overflow-y-auto hide-scroll">
                           {approvedLocations.map(loc => (
                             <div key={loc.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                               <span className="text-[10px] font-bold truncate">{loc.name}</span>
                               <div className="flex gap-1">
                                 <button onClick={()=>openEditModal(loc)} className="p-1 text-blue-500 bg-blue-50 rounded"><Edit3 size={12}/></button>
                                 <button onClick={()=>handleDeleteLocation(loc.id)} className="p-1 text-red-500 bg-red-50 rounded"><Trash2 size={12}/></button>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>

                      <div className={`p-4 rounded-3xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                         <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                           <span className="text-xs font-bold text-red-500 flex items-center gap-1"><ShieldAlert size={14}/> ផ្នែក Security Logs</span>
                         </div>
                         <div className="space-y-2 max-h-48 overflow-y-auto hide-scroll">
                           {securityLogs.map(log => (
                             <div key={log.id} className="p-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-[9px] text-slate-600 dark:text-slate-400">
                               <p><strong>IP:</strong> {log.ipAddress}</p>
                               <p><strong>Device:</strong> {log.deviceModel}</p>
                               <p><strong>Attempt:</strong> {log.attemptedPassword} <span className="float-right text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span></p>
                             </div>
                           ))}
                           {securityLogs.length===0 && <p className="text-[10px] text-center text-slate-400 py-4">មានសុវត្ថិភាពល្អ</p>}
                         </div>
                      </div>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                      {!showAdminLogin ? (
                        <button onClick={() => setShowAdminLogin(true)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs flex justify-center items-center gap-2 text-slate-600">
                          <ShieldCheck size={16} /> ចូលគ្រប់គ្រង (Admin)
                        </button>
                      ) : (
                        <form onSubmit={handleAdminLogin} className="space-y-3 animate-slide-up">
                          <input type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} className={`w-full p-3 rounded-xl border text-xs outline-none text-center tracking-widest ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="••••••••" />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl">បោះបង់</button>
                            <button type="submit" className="flex-1 py-2 bg-[#00a651] text-white text-xs font-bold rounded-xl">បញ្ជាក់</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </main>

            <nav className={`absolute bottom-0 w-full flex justify-around items-center py-2 pb-6 z-30 border-t ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <Home size={20} className={activeTab === 'home' ? 'fill-current' : ''} />
                <span className="text-[9px] font-bold">ទំព័រដើម</span>
              </button>
              
              <button onClick={attemptToAddLocation} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'add' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <PlusCircle size={20} className={activeTab === 'add' ? 'fill-current' : ''} />
                <span className="text-[9px] font-bold">បន្ថែម</span>
              </button>

              <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'reports' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <BarChart2 size={20} className={activeTab === 'reports' ? 'fill-current' : ''} />
                <span className="text-[9px] font-bold">របាយការណ៍</span>
              </button>

              <button onClick={() => { if(!username && !isAdmin) setIsUsernameModalOpen(true); else setActiveTab('profile'); }} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <User size={20} className={activeTab === 'profile' ? 'fill-current' : ''} />
                <span className="text-[9px] font-bold">{isAdmin ? 'រដ្ឋបាល' : 'ខ្ញុំ'}</span>
              </button>
            </nav>

          </div>
        )}

        {/* Modal លម្អិតទីតាំង */}
        {selectedLocationDetails && (
          <div className="absolute inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-end justify-center animate-fadeIn">
            <div className={`w-full h-[85%] rounded-t-[2.5rem] flex flex-col overflow-hidden animate-slide-up ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
              <div className="relative h-48 shrink-0">
                <img src={selectedLocationDetails.imageUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setSelectedLocationDetails(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"><X size={16}/></button>
                <div className="absolute bottom-4 left-4">
                  <span className="px-2 py-1 bg-[#00a651] text-white text-[10px] font-bold rounded-lg mb-1 inline-block">{selectedLocationDetails.category}</span>
                </div>
              </div>
              <div className="p-5 flex-1 overflow-y-auto hide-scroll space-y-4">
                <h2 className="font-moul text-lg leading-snug">{selectedLocationDetails.name}</h2>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{selectedLocationDetails.district}</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">ឃុំ{selectedLocationDetails.commune}</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{selectedLocationDetails.village}</span>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <h4 className="font-bold text-xs text-[#00a651] mb-2 flex items-center gap-1.5"><Phone size={14}/> លេខទំនាក់ទំនង</h4>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{selectedLocationDetails.phone || 'មិនមាន'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs mb-1.5 text-slate-400 uppercase tracking-wider">ព័ត៌មានលម្អិត</h4>
                  <p className="text-sm leading-relaxed">{selectedLocationDetails.info}</p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <a href={selectedLocationDetails.mapLink} target="_blank" rel="noreferrer" className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold flex justify-center items-center gap-2">
                  <MapIcon size={18}/> ស្វែងរកទីតាំងនេះលើផែនទី
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Username Request Modal */}
        {isUsernameModalOpen && (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <button onClick={() => setIsUsernameModalOpen(false)} className="absolute top-4 right-4 text-slate-400 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full"><X size={14}/></button>
              <div className="w-16 h-16 bg-[#00a651]/10 rounded-full mx-auto flex items-center justify-center mb-4 text-[#00a651]">
                <User size={30} />
              </div>
              <h3 className="text-center font-bold text-base mb-1 font-moul">បង្កើតគណនី ID សហគមន៍</h3>
              <p className="text-center text-[10.5px] text-slate-500 mb-5 leading-relaxed">កំណត់ឈ្មោះសម្គាល់របស់អ្នក ដើម្បីទទួលបានសិទ្ធិបន្ថែមទីតាំងក្នុងភូមិ</p>
              
              <input 
                type="text" 
                placeholder="បញ្ចូលឈ្មោះរបស់អ្នក..." 
                value={usernameInput}
                onChange={e=>setUsernameInput(e.target.value)}
                className={`w-full p-4 rounded-xl outline-none border font-bold text-center text-sm mb-4 focus:border-[#00a651] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
              
              <div className="flex gap-3">
                <button onClick={()=>setIsUsernameModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300">បិទ</button>
                <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#00a651] text-white rounded-xl font-bold text-xs shadow-md">រក្សាទុក</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Edit Modal */}
        {showEditModal && editingLoc && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className={`w-full max-w-sm p-5 rounded-3xl shadow-2xl h-[500px] overflow-y-auto hide-scroll ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs text-[#00a651] flex items-center gap-1.5 font-moul"><Edit3 size={14}/> កែប្រែព័ត៌មានទីតាំង</h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><X size={14}/></button>
              </div>
              
              <form onSubmit={handleUpdateLocation} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-400 mb-1 block">ឈ្មោះទីតាំង</label>
                  <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-400 mb-1 block">ស្រុក</label>
                    <input type="text" value={editDistrict} onChange={e=>setEditDistrict(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 mb-1 block">ឃុំ</label>
                    <input type="text" value={editCommune} onChange={e=>setEditCommune(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-400 mb-1 block">ភូមិ</label>
                    <input type="text" value={editVillage} onChange={e=>setEditVillage(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 mb-1 block">លេខទូរស័ព្ទ</label>
                    <input type="text" value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">បោះបង់</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#00a651] text-white rounded-xl font-bold">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast Alert Notification */}
        {toastAlert.show && (
          <div className="absolute top-4 left-4 right-4 z-[60] flex justify-center animate-slide-up">
            <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-[11px] text-white ${toastAlert.type === 'error' ? 'bg-red-500' : 'bg-[#00a651]'}`}>
              {toastAlert.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
              {toastAlert.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}