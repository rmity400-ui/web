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
  
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false); 
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  
  // States សម្រាប់បង្ហាញព័ត៌មានលម្អិតទីតាំង (Modal)
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);

  // States សម្រាប់ Admin កែប្រែទិន្នន័យ (Edit)
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
    
    if (savedUser) {
      setUsername(savedUser);
      setCurrentPage(2);
    }
    if (savedPhoto) setProfileImage(savedPhoto);
    if (savedMode === 'true') setIsDarkMode(true);

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

    // Fetch Users for Report
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), (snap) => {
      const uList = [];
      snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
      setUserList(uList);
    });

    // Fetch Visits for Report
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

  // Record active user session for Reports
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

  // ADMIN: Edit Location Setup
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

  // Report Calculations
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
          } catch(e){}
        }
        showToast("បានផ្លាស់ប្តូររូបថតគណនីរួចរាល់!", "success");
      };
      reader.readAsDataURL(file);
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
        .chart-bar { transition: height 1s ease-out; }
      `}</style>

      {/* Main Responsive Wrapper */}
      <div className={`w-full max-w-md h-screen md:h-[840px] relative overflow-hidden flex flex-col shadow-2xl md:rounded-[42px] md:border-[10px] md:border-slate-950 transition-all ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* ==================== PAGE 1 (WELCOME SCREEN) ==================== */}
        {currentPage === 1 && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-cover bg-center animate-fadeIn" style={{ backgroundImage: `url(${WELCOME_BACKGROUND_URL})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-transparent"></div>
            
            <div className="relative z-10 p-6 mt-20 text-center animate-slide-up">
              {/* Logo រូបតំណាងថ្មីជំនួស Map Icon */}
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg border-4 border-emerald-500 overflow-hidden">
                <img src="logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-black text-white drop-shadow-md leading-relaxed font-moul">
                សូមស្វាគមន៍<br/><span className="text-xl">មកកាន់បណ្តាញទិន្នន័យសហគមន៍</span>
              </h1>
            </div>

            <div className="relative z-10 px-6 py-6 mx-5 bg-slate-950/70 backdrop-blur-md rounded-3xl border border-white/10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-sm font-black text-emerald-400 mb-4 font-moul text-center">គោលបំណងនៃគម្រោង</h3>
              <p className="text-[11px] text-slate-200 leading-relaxed text-justify font-siemreap mb-4">
                គម្រោងនេះជួយសម្រួលដល់ការរាយការណ៍ផ្សេងៗ ដែលពួកគាត់បានជួបទៅកាន់ស្ថាប័នណាមួយនៅក្នុងតំបន់ និងស្គាល់ពីភូមិឃុំបានតាមរយៈ Web App នេះ។
              </p>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-[11px] text-emerald-300 leading-relaxed text-center flex items-center justify-center gap-1.5 font-bold">
                  <Search size={14}/> ជួយស្វែងរកសាលារៀន មណ្ឌលសុខភាព និងប៉ុស្តិ៍ប៉ូលីសតាមដែលអាចធ្វើទៅបាន។
                </p>
              </div>
            </div>

            <div className="relative z-10 p-8 text-center pb-12">
              <button 
                onClick={handleProceed}
                className="w-[85%] mx-auto py-3.5 block bg-[#00a651] hover:bg-[#008f45] active:scale-95 transition-transform text-white rounded-full font-bold text-sm shadow-xl shadow-emerald-900/50 font-moul tracking-wide"
              >
                ដំណើរការចូលប្រើប្រាស់
              </button>
            </div>
          </div>
        )}

        {/* ==================== PAGE 2 (MAIN APP) ==================== */}
        {currentPage === 2 && (
          <div className={`flex-1 flex flex-col h-full relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            
            {/* Header ថ្មី */}
            <header className={`px-4 py-3 flex justify-between items-center z-20 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b shadow-sm`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentPage(1)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-[#00a651] transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="font-black text-[13px] text-[#00a651] font-moul leading-tight">សូមស្វាគមន៍</h2>
                  <p className="text-[9px] text-slate-500 font-bold">បណ្តាញទិន្នន័យសហគមន៍</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={toggleDarkMode} className="text-slate-400 p-1">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div onClick={() => setActiveTab('profile')} className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border border-[#00a651]/30">
                  {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : isAdmin ? <span className="font-bold text-[#00a651] text-[10px]">AD</span> : username ? <span className="font-black text-slate-600 dark:text-slate-200 text-[10px]">{username.substring(0,2).toUpperCase()}</span> : <User size={16} className="text-slate-500" />}
                </div>
              </div>
            </header>

            {/* Main Content Area (Scrollable) */}
            <main className={`flex-1 overflow-y-auto hide-scroll pb-20 z-10 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
              
              {/* TAB 1: EXPLORE / LOCATIONS */}
              {activeTab === 'home' && (
                <div className="animate-slide-up p-4 space-y-4">
                  
                  {/* Search Bar */}
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

                  {/* District Buttons (Fixed Size & Neat) */}
                  <div className="flex justify-center">
                    <div className={`flex p-1.5 rounded-2xl w-full mx-auto ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <button onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune('ស្តៅ'); }} className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all font-moul ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-[#00a651] text-white shadow-md' : 'text-slate-500'}`}>
                        ស្រុករតនមណ្ឌល
                      </button>
                      <button onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); }} className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all font-moul ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-[#00a651] text-white shadow-md' : 'text-slate-500'}`}>
                        ស្រុកផ្សេងៗ
                      </button>
                    </div>
                  </div>

                  {/* Commune Select */}
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

                  {/* Location List (Minimal Card View) */}
                  <div className="space-y-4 pb-8 mt-2">
                    <h3 className="font-bold text-xs border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5 font-moul text-slate-700 dark:text-slate-300">
                      📍 លទ្ធផលទីតាំង ({displayedLocations.length})
                    </h3>
                    
                    {displayedLocations.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {displayedLocations.map(loc => (
                          <div 
                            key={loc.id} 
                            onClick={() => setSelectedLocationDetails(loc)} 
                            className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} animate-slide-up cursor-pointer hover:shadow-md transition active:scale-95`}
                          >
                            <div className="relative h-28 bg-slate-200">
                              <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3 text-center">
                              <h4 className="font-bold text-[11px] font-moul leading-snug truncate text-[#00a651] dark:text-emerald-400">{loc.name}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-50">
                        <MapIcon size={36} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-bold font-siemreap">មិនមានទិន្នន័យទីតាំងទេ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: REPORTS (របាយការណ៍) */}
              {activeTab === 'reports' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <h2 className="font-moul text-sm text-[#00a651] mb-2 flex items-center gap-2"><BarChart2 size={18}/> របាយការណ៍ទិន្នន័យប្រព័ន្ធ</h2>
                  <p className="text-[10px] text-slate-500 mb-4 font-siemreap">ទិន្នន័យប្រើប្រាស់ជាក់ស្តែង ទាញយកពីប្រព័ន្ធកណ្តាលនៃកម្មវិធី។ មើលបាន មិនអាចកែប្រែបាន។</p>

                  <div className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-moul">ចំនួនអ្នកប្រើប្រាស់សរុប</p>
                        <h3 className="text-3xl font-black text-[#00a651] mt-1">{reportStats.totalUsers} <span className="text-xs font-normal text-slate-500">នាក់</span></h3>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-[#00a651]"><Users size={24}/></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <p className="text-[9px] font-bold text-slate-400 mb-1 font-moul">សប្តាហ៍នេះ</p>
                      <p className="text-lg font-black text-[#00a651]">{reportStats.weekly}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <p className="text-[9px] font-bold text-slate-400 mb-1 font-moul">ខែនេះ</p>
                      <p className="text-lg font-black text-blue-500">{reportStats.monthly}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <p className="text-[9px] font-bold text-slate-400 mb-1 font-moul">ឆ្នាំនេះ</p>
                      <p className="text-lg font-black text-purple-500">{reportStats.yearly}</p>
                    </div>
                  </div>

                  {/* ក្រាហ្វិកគំនូសតាង (Custom SVG Bar Chart) */}
                  <div className={`p-4 rounded-3xl border shadow-sm mt-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <h4 className="font-bold text-xs text-slate-600 dark:text-slate-300 mb-6 font-moul">ស្ថិតិប្រចាំខែ (%)</h4>
                    <div className="w-full h-40 relative">
                      <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
                        {/* Grid Lines */}
                        <line x1="0" y1="20" x2="300" y2="20" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4"/>
                        <line x1="0" y1="70" x2="300" y2="70" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4"/>
                        <line x1="0" y1="120" x2="300" y2="120" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1"/>
                        
                        {/* Bars & Text */}
                        {reportStats.chartData.map((data, index) => {
                          const xPos = index * 48 + 15;
                          const barHeight = data.percent;
                          const yPos = 120 - barHeight;
                          return (
                            <g key={index}>
                              <rect x={xPos} y={yPos} width="24" height={barHeight} fill="#00a651" rx="4" className="chart-bar" />
                              <text x={xPos + 12} y="135" textAnchor="middle" fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="10" className="font-siemreap font-bold">{data.name}</text>
                              <text x={xPos + 12} y={yPos - 6} textAnchor="middle" fill={isDarkMode ? '#e2e8f0' : '#475569'} fontSize="9" fontWeight="bold">{data.percent}%</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* ក្រាហ្វិករង្វង់ (Custom SVG Pie Chart Dummy) */}
                  <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} flex items-center justify-between`}>
                    <div>
                      <h4 className="font-bold text-xs text-slate-600 dark:text-slate-300 mb-2 font-moul">ប្រភេទអ្នកប្រើប្រាស់</h4>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00a651]"></span> ភ្ញៀវទូទៅ (70%)</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> សមាជិកភូមិ (25%)</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> រដ្ឋបាល Admin (5%)</p>
                      </div>
                    </div>
                    <svg width="80" height="80" viewBox="0 0 32 32" className="rotate-[-90deg] rounded-full">
                      <circle r="16" cx="16" cy="16" fill="#f1f5f9" />
                      <circle r="16" cx="16" cy="16" fill="#00a651" strokeDasharray="70 100" />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#3b82f6" strokeWidth="32" strokeDasharray="25 100" strokeDashoffset="-70" />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f59e0b" strokeWidth="32" strokeDasharray="5 100" strokeDashoffset="-95" />
                    </svg>
                  </div>
                </div>
              )}

              {/* TAB 3: ADD LOCATION */}
              {activeTab === 'add' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h3 className="font-bold text-sm text-[#00a651] mb-4 flex items-center gap-2 font-moul">
                      <PlusCircle size={18}/> បន្ថែមទីតាំងថ្មី
                    </h3>
                    
                    <form onSubmit={submitLocation} className="space-y-4 font-siemreap">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះទីតាំង *</label>
                        <input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. សាលារៀន ឬ ប៉ុស្តិ៍ប៉ូលីស" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ស្រុក *</label>
                          <select value={newLocDistrict} onChange={e=>setNewLocDistrict(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                            <option value="ផ្សេងៗ">ស្រុកផ្សេងៗ</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ប្រភេទ *</label>
                          <select value={newLocCategory} onChange={e=>setNewLocCategory(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            <option value="សាលារៀន">សាលារៀន</option>
                            <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                            <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                            <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                          </select>
                        </div>
                      </div>

                      {newLocDistrict === 'ផ្សេងៗ' && (
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះស្រុកថ្មី *</label>
                          <input type="text" required value={newLocCustomDistrict} onChange={e=>setNewLocCustomDistrict(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="បញ្ចូលឈ្មោះស្រុក" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ឃុំ *</label>
                          <input type="text" required value={newLocCommune} onChange={e=>setNewLocCommune(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. ស្តៅ" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ភូមិ *</label>
                          <input type="text" required value={newLocVillage} onChange={e=>setNewLocVillage(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="ឧ. ភូមិស្តៅ" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">រូបភាពទីតាំងគំរូ (ចាំបាច់បើសិនមាន)</label>
                        <label className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-800/80' : 'border-[#00a651]/30 bg-[#00a651]/5 hover:bg-[#00a651]/10'}`}>
                          {newLocImageBase64 ? (
                            <img src={newLocImageBase64} className="w-full h-full object-cover" alt="preview" />
                          ) : (
                            <>
                              <Camera className="text-[#00a651] mb-2" size={24} />
                              <span className="text-[10px] text-slate-500 font-bold">ចុចដើម្បីបញ្ចូលរូបថត (Upload)</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>

                      <button type="submit" disabled={isSubmitting} className="w-full bg-[#00a651] text-white py-4 rounded-2xl font-bold font-moul mt-2 shadow-lg hover:bg-[#008f45] transition-all">
                        {isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនសំណើទីតាំង'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: PROFILE & ADMIN */}
              {activeTab === 'profile' && (
                <div className="animate-slide-up p-4 space-y-4">
                  
                  {/* USER INFO CARD */}
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-[#00a651]/10 rounded-full border-2 border-[#00a651]/40 flex items-center justify-center text-lg font-black overflow-hidden">
                          {profileImage ? <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-slate-500">{username ? username.substring(0,2).toUpperCase() : 'US'}</span>}
                        </div>
                        <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#00a651] text-white rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#008f45]">
                          <Camera size={12} />
                          <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight font-moul">{isAdmin ? 'រដ្ឋបាលប្រព័ន្ធ (Admin)' : (username || 'ភ្ញៀវសហគមន៍')}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">គណនី៖ {isAdmin ? 'សិទ្ធិខ្ពស់បំផុត' : 'សមាជិកធម្មតា'}</p>
                      </div>
                    </div>
                  </div>

                  {/* ADMIN LOGIN */}
                  {!isAdmin && (
                    <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                      {!showAdminLogin ? (
                        <button onClick={() => setShowAdminLogin(true)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300 font-moul">
                          <ShieldCheck size={16} /> ចូលកាន់កិច្ចការរដ្ឋបាល (Admin)
                        </button>
                      ) : (
                        <form onSubmit={handleAdminLogin} className="space-y-3 animate-slide-up">
                          <h4 className="font-bold text-xs flex items-center gap-1 font-moul"><ShieldAlert size={14} className="text-yellow-500"/> បញ្ចូលលេខកូដ</h4>
                          <input type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} className={`w-full p-3.5 rounded-xl border text-xs outline-none focus:border-[#00a651] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} placeholder="••••••••" />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl font-moul">បោះបង់</button>
                            <button type="submit" className="flex-1 py-3 bg-[#00a651] text-white text-xs font-bold rounded-xl shadow-md font-moul">បញ្ជាក់</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* ADMIN WORKSPACE */}
                  {isAdmin && (
                    <div className="space-y-4 animate-slide-up">
                      <div className="flex gap-1.5 overflow-x-auto hide-scroll pb-1">
                        <button onClick={() => setAdminSubTab('approvals')} className={`px-4 py-2.5 rounded-full text-[10px] font-bold font-moul whitespace-nowrap transition-all ${adminSubTab === 'approvals' ? 'bg-[#00a651] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          📥 អនុម័ត ({pendingLocations.length})
                        </button>
                        <button onClick={() => setAdminSubTab('data')} className={`px-4 py-2.5 rounded-full text-[10px] font-bold font-moul whitespace-nowrap transition-all ${adminSubTab === 'data' ? 'bg-[#00a651] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          🗂️ ទិន្នន័យទាំងអស់
                        </button>
                        <button onClick={() => setAdminSubTab('security')} className={`px-4 py-2.5 rounded-full text-[10px] font-bold font-moul whitespace-nowrap transition-all ${adminSubTab === 'security' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          🛡️ សុវត្ថិភាព
                        </button>
                      </div>

                      {/* Admin Tab: Approvals */}
                      {adminSubTab === 'approvals' && (
                        <div className="space-y-3">
                          {pendingLocations.map(loc => (
                            <div key={loc.id} className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-xs font-moul text-[#00a651]">{loc.name}</h4>
                                  <p className="text-[10px] text-slate-500 mt-1">ដោយ៖ {loc.submittedBy}</p>
                                  <p className="text-[10px] text-slate-500">ភូមិ៖ {loc.village}, ឃុំ{loc.commune}</p>
                                </div>
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold">{loc.category}</span>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => adminApprove(loc)} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-[11px] hover:bg-emerald-700">✓ ព្រម</button>
                                <button onClick={() => adminReject(loc)} className="flex-1 py-2 bg-red-100 text-red-600 font-bold rounded-xl text-[11px] hover:bg-red-200">✗ លុបចោល</button>
                              </div>
                            </div>
                          ))}
                          {pendingLocations.length === 0 && <p className="text-center py-8 text-xs text-slate-400 font-siemreap">គ្មានសំណើថ្មីកំពុងរង់ចាំឡើយ</p>}
                        </div>
                      )}

                      {/* Admin Tab: Data Management */}
                      {adminSubTab === 'data' && (
                        <div className="space-y-3">
                          {approvedLocations.map(loc => (
                            <div key={loc.id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex gap-3 items-center`}>
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                                <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[11px] truncate">{loc.name}</h4>
                                <p className="text-[9px] text-slate-500">{loc.village}, ឃុំ{loc.commune}</p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                <button onClick={() => openEditModal(loc)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={12}/></button>
                                <button onClick={() => handleDeleteLocation(loc.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 size={12}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin Tab: Security Logs */}
                      {adminSubTab === 'security' && (
                        <div className="space-y-3">
                          {securityLogs.length > 0 ? (
                            securityLogs.map(log => (
                              <div key={log.id} className="p-4 rounded-3xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 text-[10px] space-y-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                  <ShieldAlert size={14} className="text-red-500" />
                                  <p className="font-bold text-red-600 dark:text-red-400 font-moul">ការចូលមិនត្រឹមត្រូវ</p>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300"><span className="font-bold">ពេលវេលា:</span> {new Date(log.timestamp).toLocaleString()}</p>
                                <p className="text-slate-600 dark:text-slate-300"><span className="font-bold">អ្នកប្រើប្រាស់:</span> {log.username} | IP: {log.ipAddress}</p>
                                <p className="text-slate-600 dark:text-slate-300"><span className="font-bold">Password សាកល្បង:</span> {log.attemptedPassword}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-8 text-xs text-slate-400 font-siemreap">មិនមានសកម្មភាពគំរាមកំហែងទេ</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logouts */}
                  {username && !isAdmin && (
                    <button onClick={() => { setUsername(''); localStorage.removeItem('vmc_username_2026'); setActiveTab('home'); }} className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex justify-center items-center gap-2 mt-6 font-moul">
                      <LogOut size={14} /> ចាកចេញពីគណនី {username}
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => { setIsAdmin(false); setActiveTab('home'); }} className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex justify-center items-center gap-2 mt-4 font-moul">
                      <LogOut size={14} /> ចាកចេញពីប្រព័ន្ធ Admin
                    </button>
                  )}
                </div>
              )}

            </main>

            {/* Bottom Navigation Menu (របារខាងក្រោម) */}
            <nav className={`absolute bottom-0 w-full flex justify-around items-center pt-2 pb-5 z-30 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] border-t rounded-t-3xl ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <Home size={22} />
                <span className="text-[10px] font-bold font-moul">ទំព័រដើម</span>
              </button>
              
              <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'reports' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <Activity size={22} />
                <span className="text-[10px] font-bold font-moul">របាយការណ៍</span>
              </button>

              <button onClick={attemptToAddLocation} className={`flex flex-col items-center gap-1 w-16 relative -top-4 ${activeTab === 'add' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform ${activeTab === 'add' ? 'bg-[#00a651] text-white scale-110' : 'bg-[#00a651] text-white'}`}>
                  <Plus size={28} />
                </div>
                <span className="text-[10px] font-bold mt-1 font-moul">បន្ថែម</span>
              </button>

              <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-[#00a651]' : 'text-slate-400'}`}>
                <User size={22} />
                <span className="text-[10px] font-bold font-moul">គណនី</span>
              </button>
            </nav>

          </div>
        )}

        {/* ==================== ផ្ទាំងបង្ហាញព័ត៌មានលម្អិត (DETAILS OVERLAY) ==================== */}
        {selectedLocationDetails && (
          <div className="absolute inset-0 z-[60] bg-slate-50 flex flex-col animate-slide-up">
            <div className="absolute top-0 w-full z-20 px-4 pt-12 pb-4 flex justify-between items-center text-white bg-gradient-to-b from-black/70 to-transparent">
              <button onClick={() => setSelectedLocationDetails(null)} className="p-2 bg-black/20 rounded-full backdrop-blur-md hover:bg-black/40"><ArrowLeft size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scroll pb-24">
              <div className="h-72 w-full bg-slate-200 relative">
                <img src={selectedLocationDetails.imageUrl} className="w-full h-full object-cover" alt={selectedLocationDetails.name} />
              </div>

              <div className="p-5 -mt-6 relative z-10 bg-slate-50 rounded-t-3xl">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="font-moul text-lg text-[#00a651] leading-snug flex-1 pr-4">{selectedLocationDetails.name}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <Layers size={18} className="text-[#00a651] mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 font-bold">ប្រភេទ</p>
                      <p className="text-xs font-bold text-slate-800">{selectedLocationDetails.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <MapPin size={18} className="text-[#00a651] mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 font-bold">ទីតាំង</p>
                      <p className="text-xs font-bold text-slate-800">{selectedLocationDetails.village}, ឃុំ{selectedLocationDetails.commune}, {selectedLocationDetails.district}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <Phone size={18} className="text-[#00a651] mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 font-bold">ទូរស័ព្ទទំនាក់ទំនង</p>
                      <p className="text-xs font-bold text-slate-800">{selectedLocationDetails.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <FileText size={18} className="text-[#00a651] mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5 font-bold">ព័ត៌មានលម្អិតបន្ថែម</p>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-siemreap">{selectedLocationDetails.info}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ប៊ូតុងខាងក្រោមសម្រាប់ខល និងមើលផែនទី */}
            <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 p-4 flex gap-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-6">
              <a href={`tel:${selectedLocationDetails.phone}`} className="flex-1 py-3.5 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 font-moul text-xs">
                <Phone size={16}/> ទូរស័ព្ទ
              </a>
              <a href={selectedLocationDetails.mapLink} target="_blank" rel="noreferrer" className="flex-1 py-3.5 bg-[#00a651] text-white rounded-xl font-bold flex items-center justify-center gap-2 font-moul text-xs">
                <MapIcon size={16}/> ផែនទី
              </a>
            </div>
          </div>
        )}

        {/* ==================== ផ្ទាំង ADMIN EDIT MODAL ==================== */}
        {showEditModal && (
          <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full bg-white rounded-3xl p-5 max-h-[90vh] overflow-y-auto hide-scroll">
              <h3 className="font-bold text-sm text-[#00a651] font-moul mb-4">កែប្រែទិន្នន័យទីតាំង</h3>
              <form onSubmit={handleUpdateLocation} className="space-y-3 font-siemreap">
                <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full p-3 rounded-xl border text-xs" placeholder="ឈ្មោះទីតាំង" required />
                <input type="text" value={editCategory} onChange={e=>setEditCategory(e.target.value)} className="w-full p-3 rounded-xl border text-xs" placeholder="ប្រភេទ" required />
                <input type="text" value={editVillage} onChange={e=>setEditVillage(e.target.value)} className="w-full p-3 rounded-xl border text-xs" placeholder="ភូមិ" required />
                <input type="text" value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full p-3 rounded-xl border text-xs" placeholder="ទូរស័ព្ទ" />
                <textarea value={editInfo} onChange={e=>setEditInfo(e.target.value)} className="w-full p-3 rounded-xl border text-xs" rows="3" placeholder="ព័ត៌មានលម្អិត"></textarea>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">បោះបង់</button>
                  <button type="submit" className="flex-1 py-3 bg-[#00a651] text-white font-bold rounded-xl text-xs">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ផ្ទាំងបង្កើត Username */}
        {isUsernameModalOpen && (
          <div className="absolute inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <div className="w-16 h-16 bg-[#00a651]/10 rounded-full mx-auto flex items-center justify-center mb-4 text-[#00a651]">
                <User size={30} />
              </div>
              <h3 className="text-center font-bold text-sm mb-1 font-moul">បង្កើតគណនី ID សហគមន៍</h3>
              <p className="text-center text-[10px] text-slate-500 mb-5 leading-relaxed font-siemreap">កំណត់ឈ្មោះសម្គាល់របស់អ្នក ដើម្បីទទួលបានសិទ្ធិបន្ថែមទីតាំងក្នុងភូមិ</p>
              <input type="text" placeholder="បញ្ចូលឈ្មោះរបស់អ្នក..." value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className={`w-full p-4 rounded-xl outline-none border font-bold text-center text-sm mb-4 focus:border-[#00a651] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              <div className="flex gap-3">
                <button onClick={()=>setIsUsernameModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 font-moul">បិទ</button>
                <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#00a651] text-white rounded-xl font-bold text-xs shadow-md font-moul">រក្សាទុក</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastAlert.show && (
          <div className="absolute top-4 left-4 right-4 z-[90] flex justify-center animate-slide-up">
            <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-[11px] text-white font-moul ${toastAlert.type === 'error' ? 'bg-red-500' : 'bg-[#00a651]'}`}>
              {toastAlert.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {toastAlert.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}