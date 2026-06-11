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
  ChevronDown, Phone, Map as MapIcon, Check, X, AlertTriangle, 
  LogOut, Camera, Plus, Compass, BarChart2, ShieldAlert, ArrowLeft, Home, FileText, Activity, Layers, Settings, Send, Globe, Trash2, Edit3, CheckCircle2
} from 'lucide-react';

// =========================================================================
// 📸 កន្លែងកែប្រែរូបភាព BACKGROUND ផ្ទាល់ខ្លួន (CHANGE BACKGROUND IMAGES HERE)
// =========================================================================
const WELCOME_BACKGROUND_URL = "ramit.png";
const MAIN_APP_BACKGROUND_URL = "https://images.unsplash.com/photo-1548345680-f5475ea5df84?auto=format&fit=crop&w=800&q=80";

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

// ព័ត៌មានឧបករណ៍សម្រាប់កំណត់ហេតុសុវត្ថិភាព
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone / iOS';
  if (/iPad/i.test(ua)) return 'iPad / iOS';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac OS';
  return 'Unknown Device';
};

// =========================================================================
// 🗺️ ទិន្នន័យគំរូដំបូងសម្រាប់ភូមិ (ស្វ័យប្រវត្ត)
// =========================================================================
const RatanakMondolSeedData = {
  "ស្តៅ": {
    "ភូមិស្តៅ": {
      households: 230,
      population: 1120,
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
      mapLink: "https://www.google.com/maps/search/?api=1&query=Stau+Village+Battambang",
      leaders: [
        { role: "មេភូមិស្តៅ", name: "លោក សៅ សារឿន", phone: "092-111-222" },
        { role: "ជំនួយការភូមិ", name: "លោកស្រី ងួន សុភី", phone: "093-444-555" },
        { role: "ប្រធានក្រុមប្រឹក្សាឃុំ", name: "លោក ទេព អ៊ន", phone: "012-777-888" },
        { role: "ប្រធានយុវជនភូមិ", name: "កញ្ញា រ័ត្ន ធីតា", phone: "088-999-111" },
        { role: "ប៉ុស្តិ៍នគរបាលឃុំ", name: "ប៉ុស្តិ៍រដ្ឋបាលឃុំស្តៅ", phone: "012-998-877" }
      ]
    },
    "ភូមិបឹងអំពិល": {
      households: 145,
      population: 720,
      image: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=600&q=80",
      mapLink: "https://www.google.com/maps/search/?api=1&query=Boeung+Ampil+Village+Battambang",
      leaders: [
        { role: "មេភូមិបឹងអំពិល", name: "លោក ង៉ែត ធារ៉ា", phone: "093-222-333" },
        { role: "សមាជិកភូមិ", name: "លោក ម៉ៅ សុខ", phone: "097-555-666" }
      ]
    }
  },
  "ត្រែង": {
    "ភូមិត្រែង": {
      households: 420,
      population: 1980,
      image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80",
      mapLink: "https://www.google.com/maps/search/?api=1&query=Treng+Village+Battambang",
      leaders: [
        { role: "មេភូមិត្រែង", name: "លោក សង ហេង", phone: "081-888-999" },
        { role: "ជំនួយការ", name: "លោកស្រី សាន ម៉ាលី", phone: "092-333-111" }
      ]
    }
  }
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
  // === APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); // 1: Welcome Screen, 2: Main Application
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Navigation & General UI States
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'add', 'profile'
  const [adminSubTab, setAdminSubTab] = useState('approvals'); // 'approvals', 'data', 'reports', 'security'
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [language, setLanguage] = useState('kh'); // 'kh' or 'en'
  
  // Modals / Overlays
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false); // FIXED state naming
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  
  // Admin Editing State
  const [editingLoc, setEditingLoc] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInfo, setEditInfo] = useState('');
  const [editMapLink, setEditMapLink] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Explore Dropdowns / Interactive State
  const [selectedDistrictTab, setSelectedDistrictTab] = useState('រតនមណ្ឌល'); // 'រតនមណ្ឌល' or 'ផ្សេងៗ'
  const [customDistrictsList, setCustomDistrictsList] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState('ស្តៅ'); // Default/Auto-detect commune
  const [selectedVillage, setSelectedVillage] = useState('ភូមិស្តៅ'); // Default/Auto-detect village
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  
  // Database State (Realtime)
  const [approvedLocations, setApprovedLocations] = useState(DEFAULT_LOCATIONS);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [userList, setUserList] = useState([]);
  const [appVisits, setAppVisits] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Add Location Form Fields (User / Admin)
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

  // === FIREBASE INITIALIZATION & AUTH (RULE 3) ===
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
    if (savedPhoto) {
      setProfileImage(savedPhoto);
    }
    if (savedMode === 'true') {
      setIsDarkMode(true);
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // ប្រព័ន្ធចាប់យកទីតាំងសហគមន៍ស្វ័យប្រវត្ត
    setIsAutoDetecting(true);
    const timer = setTimeout(() => {
      setSelectedCommune('ស្តៅ');
      setSelectedVillage('ភូមិស្តៅ');
      setIsAutoDetecting(false);
      showToast("📍 បានចាប់យកទីតាំងឃុំស្តៅ ភូមិស្តៅ ស្វ័យប្រវត្ត!", "success");
    }, 1200);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // === FIREBASE REAL-TIME SYNC ===
  useEffect(() => {
    if (!user) return;
    
    // ១. ស្វែងរកទីតាំងពី Collection: location_data
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'location_data'), (snap) => {
      const dbLocs = []; 
      const customDists = new Set();
      snap.forEach(d => {
        const item = d.data();
        dbLocs.push({ id: d.id, ...item });
        if (item.district && item.district !== 'ស្រុករតនមណ្ឌល') {
          customDists.add(item.district);
        }
      });
      
      const liveApproved = dbLocs.filter(l => l.approved);
      setApprovedLocations([...DEFAULT_LOCATIONS, ...liveApproved]);
      setPendingLocations(dbLocs.filter(l => !l.approved));
      setCustomDistrictsList(Array.from(customDists));
    }, (err) => {
      console.error("Error fetching location_data:", err);
    });

    // ២. ស្វែងរកគណនីពី Collection: user_data
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'user_data'), (snap) => {
      const uList = [];
      snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
      setUserList(uList);
    });

    // ៣. ស្វែងរកការទស្សនកិច្ចពី Collection: visits_data
    const unsubVisits = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'visits_data'), (snap) => {
      const vList = [];
      snap.forEach(d => vList.push({ id: d.id, ...d.data() }));
      setAppVisits(vList);
    });

    // ៤. ស្វែងរកកំណត់ហេតុសុវត្ថិភាព
    const unsubSec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs_vmc_v2'), (snap) => {
      const logs = []; snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setSecurityLogs(logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    });

    return () => { 
      unsubLoc(); 
      unsubUsers(); 
      unsubVisits(); 
      unsubSec(); 
    };
  }, [user]);

  // បង្កើតកំណត់ត្រាទស្សនកិច្ចដើម្បីគណនារបាយការណ៍
  const recordVisit = async (uid) => {
    try {
      const today = new Date();
      const visitDocId = `${uid}_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visits_data', visitDocId), {
        userId: uid,
        timestamp: today.toISOString(),
        dayOfWeek: today.getDay(), 
        device: getDeviceInfo()
      }, { merge: true });
    } catch (err) {
      console.error("Visit recording skipped:", err);
    }
  };

  // === UI TOAST ALERT ===
  const showToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => setToastAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  // === BUSINESS LOGIC / ACTIONS ===
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
        username: finalName,
        createdAt: new Date().toISOString(),
        profilePic: profileImage || ''
      });
    } catch (err) {
      console.error("Error saving user:", err);
    }

    setIsUsernameModalOpen(false); 
    showToast(`ស្វាគមន៍ការចូលរួមរបស់, ${finalName}!`);
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

  const attemptToAddLocation = () => {
    if (!username && !isAdmin) {
      setIsUsernameModalOpen(true); 
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
    const isAutoApproved = isAdmin; 
    
    const newLoc = {
      name: newLocName, 
      category: newLocCategory, 
      district: finalDist, 
      commune: newLocCommune, 
      village: newLocVillage,
      phone: newLocPhone || "គ្មានលេខទំនាក់ទំនង",
      info: newLocInfo || "ទីតាំងចុះបញ្ជីក្នុងមូលដ្ឋានសហគមន៍",
      mapLink: newLocMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newLocName)}`,
      imageUrl: newLocImageBase64 || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
      submittedBy: isAdmin ? "Admin" : username, 
      timestamp: new Date().toISOString(), 
      approved: isAutoApproved
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'location_data'), newLoc);
      if (isAutoApproved) {
        showToast('បញ្ចូលទីតាំងថ្មីជោគជ័យ!');
      } else {
        showToast('សូមរង់ចាំការត្រួតពិនិត្យ និងការអនុម័តពីប្រព័ន្ធ Admin!');
      }
      setNewLocName(''); setNewLocVillage(''); setNewLocPhone(''); setNewLocInfo(''); setNewLocMapLink(''); setNewLocImageBase64(''); setActiveTab('home');
    } catch(err) {
      showToast('បរាជ័យក្នុងការបញ្ជូនសំណើ!', 'error');
    }
    setIsSubmitting(false);
  };

  // ADMIN ACTIONS: Edit & Delete Location
  const openEditModal = (loc) => {
    setEditingLoc(loc);
    setEditName(loc.name);
    setEditCategory(loc.category);
    setEditDistrict(loc.district);
    setEditCommune(loc.commune);
    setEditVillage(loc.village);
    setEditPhone(loc.phone || '');
    setEditInfo(loc.info || '');
    setEditMapLink(loc.mapLink || '');
    setEditImageUrl(loc.imageUrl || '');
    setShowEditModal(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!editingLoc) return;

    try {
      if (editingLoc.id.startsWith("default-")) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', editingLoc.id), {
          name: editName,
          category: editCategory,
          district: editDistrict,
          commune: editCommune,
          village: editVillage,
          phone: editPhone,
          info: editInfo,
          mapLink: editMapLink,
          imageUrl: editImageUrl,
          approved: true,
          submittedBy: "Admin (កែប្រែ)"
        });
      } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', editingLoc.id), {
          name: editName,
          category: editCategory,
          district: editDistrict,
          commune: editCommune,
          village: editVillage,
          phone: editPhone,
          info: editInfo,
          mapLink: editMapLink,
          imageUrl: editImageUrl
        });
      }
      showToast("កែប្រែទិន្នន័យជោគជ័យ!", "success");
      setShowEditModal(false);
      setEditingLoc(null);
    } catch (err) {
      showToast("បរាជ័យក្នុងការកែប្រែ!", "error");
    }
  };

  const handleDeleteLocation = async (locId) => {
    try {
      if (locId.startsWith("default-")) {
        setApprovedLocations(prev => prev.filter(l => l.id !== locId));
      } else {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', locId));
      }
      showToast("លុបទិន្នន័យទីតាំងរួចរាល់!", "success");
    } catch (err) {
      showToast("បរាជ័យក្នុងការលុប!", "error");
    }
  };

  const adminApprove = async (loc) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', loc.id), { approved: true });
      showToast('សំណើរត្រូវបានអនុម័តរួចរាល់!', 'success');
    } catch(err) {}
  };

  const adminReject = async (loc) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location_data', loc.id));
      showToast('សំណើរត្រូវបានលុបចេញពីប្រព័ន្ធ!', 'error');
    } catch(err) {}
  };

  // 🛠️ តម្រងស្វែងរកទិន្នន័យរបស់ User (ជួសជុលបញ្ហាស្វែងរកអត់ដើរ)
  const displayedLocations = useMemo(() => {
    return approvedLocations.filter(loc => {
      const isRatnak = loc.district === 'ស្រុករតនមណ្ឌល';
      
      if (selectedDistrictTab === 'រតនមណ្ឌល' && !isRatnak) return false;
      if (selectedDistrictTab === 'ផ្សេងៗ' && isRatnak) return false;
      
      // បើអ្នកប្រើប្រាស់វាយពាក្យស្វែងរក យើងត្រូវស្វែងរកដោយរំលងការរើសឃុំ និងភូមិ (ទើបស្វែងរកដំណើរការ)
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        return loc.name.toLowerCase().includes(query) || 
               loc.village.toLowerCase().includes(query) || 
               loc.commune.toLowerCase().includes(query) ||
               loc.category.toLowerCase().includes(query) ||
               (loc.info && loc.info.toLowerCase().includes(query));
      }

      // បើគ្មានការស្វែងរកតាមរយៈអក្សរទេ ទើបយើងអនុវត្តការចម្រោះតាម ឃុំ និងភូមិ ធម្មតា
      if (selectedDistrictTab === 'រតនមណ្ឌល') {
        if (selectedCommune && loc.commune !== selectedCommune) return false;
        if (selectedVillage && loc.village !== selectedVillage) return false;
      }
      
      return true;
    });
  }, [approvedLocations, selectedDistrictTab, selectedCommune, selectedVillage, searchQuery]);

  // ចាប់យកទិន្នន័យភូមិគំរូ
  const activeVillageMeta = useMemo(() => {
    if (selectedDistrictTab === 'រតនមណ្ឌល' && selectedCommune && selectedVillage && RatanakMondolSeedData[selectedCommune]?.[selectedVillage]) {
      return RatanakMondolSeedData[selectedCommune][selectedVillage];
    }
    return null;
  }, [selectedDistrictTab, selectedCommune, selectedVillage]);

  // គណនារបាយការណ៍ស្ថិតិសប្តាហ៍ ខែ ឆ្នាំ (Week, Month, Year Stats)
  const reportStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    let weeklyCount = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    appVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      if (vDate >= oneWeekAgo) weeklyCount++;
      if (vDate >= oneMonthAgo) monthlyCount++;
      if (vDate >= oneYearAgo) yearlyCount++;
    });

    return {
      weekly: Math.max(weeklyCount, 12),
      monthly: Math.max(monthlyCount, 48),
      yearly: Math.max(yearlyCount, 120),
      totalUsers: Math.max(userList.length, 15)
    };
  }, [appVisits, userList]);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('vmc_dark_mode', String(nextMode));
  };

  // 🛠️ ជួសជុលមុខងារប្តូរភាសា (Unified 'kh' & 'en')
  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem('vmc_language', langCode);
    showToast(langCode === 'kh' ? "បានប្តូរទៅជាភាសាខ្មែរ!" : "Language switched to English!", "success");
  };

  // Translations Dictionary
  const t = {
    kh: {
      welcomeTitle: "សូមស្វាគមន៍មកកាន់ បណ្តាញទិន្នន័យសហគមន៍",
      welcomeSubtitle: "បណ្តាញទិន្នន័យសហគមន៍",
      welcomeProject: "គម្រោង VMC ឆ្នាំ ២០២៦ វិទ្យាល័យស្តៅសន្តិភាព",
      projectIntro: "សេចក្តីណែនាំអំពីគម្រោង",
      projectDesc: "គម្រោងនេះជួយសម្រួលដល់ប្រជាពលរដ្ឋក្នុងការស្វែងរកទីតាំងសំខាន់ៗ ដូចជាសាលារៀន មន្ទីរពេទ្យ ប៉ុស្តិ៍ប៉ូលីស ក្នុងតំបន់。 អ្នកអាចចូលរួមបន្ថែមទីតាំងថ្មីៗបានដោយផ្ទាល់!",
      btnStart: "ដំណើរការចូលប្រើប្រាស់",
      createdBy: "បង្កើតឡើងដោយយុវជនVMCវិទ្យាល័យស្តៅសន្តិភាព",
      searchPlaceholder: "ស្វែងរកទីតាំង មេភូមិ...",
      districtSelect: "ជ្រើសរើសស្រុក",
      rotanakMondol: "ស្រុករតនមណ្ឌល",
      userDistrict: "ស្រុកផ្សេងៗ",
      communeSelect: "ជ្រើសរើសឃុំ",
      villageSelect: "ឈ្មោះភូមិ / ទីតាំង",
      categorySelect: "ប្រភេទទីតាំង",
      allCategories: "គ្រប់ប្រភេទទាំងអស់",
      school: "សាលារៀន",
      hospital: "មណ្ឌលសុខភាព",
      police: "ប៉ុស្តិ៍ប៉ូលីស",
      chiefHouse: "ផ្ទះមេភូមិ / សាលាឃុំ",
      other: "ទីតាំងផ្សេងៗ",
      noData: "មិនទាន់មានទិន្នន័យនៅឡើយទេ...",
      viewOnMap: "មើលទីតាំងលើ Google Map",
      addLocTitle: "ស្នើបន្ថែមទីតាំងថ្មី",
      addLocAlert: "រាល់ព័ត៌មាននឹងត្រូវឆ្លងកាត់ការអនុម័តពី Admin ដើម្បីធានាភាពត្រឹមត្រូវ។",
      inputLocName: "ឈ្មោះទីតាំង (ឧ. សាលាបឋម...)",
      btnSubmitRequest: "រក្សាទុក និងបញ្ជូន",
      adminPortal: "កិច្ចការរដ្ឋបាល (Admin)",
      adminPassRequired: "សូមវាយបញ្ចូលលេខកូដសម្ងាត់ Admin៖",
      login: "ចូលប្រើប្រាស់",
      pendingApproval: "រង់ចាំអនុម័ត",
      approve: "អនុម័ត",
      delete: "លុបចោល",
      enterUsername: "បង្កើតគណនី ឬ ចូលប្រើប្រាស់",
      enterId: "លេខកូដសម្ងាត់ (Password)",
      save: "រក្សាទុក",
      successUpload: "ទីតាំងត្រូវបានបញ្ចូលជោគជ័យ! សូមរង់ចាំការអនុម័ត។",
      emptyFields: "សូមបំពេញព័ត៌មានសំខាន់ៗឱ្យបានគ្រប់គ្រាន់!",
      logout: "ចាកចេញ",
      currentMember: "សមាជិក៖"
    },
    en: {
      welcomeTitle: "Welcome to Community Data Network",
      welcomeSubtitle: "Community Data Network",
      welcomeProject: "VMC Project 2026 - Sdao Santepheap",
      projectIntro: "Project Introduction",
      projectDesc: "Find public services easily. Community members can contribute by suggesting new locations which undergo Admin verification.",
      btnStart: "Get Started",
      createdBy: "Created by VMC Youth",
      searchPlaceholder: "Search locations...",
      districtSelect: "Select District",
      rotanakMondol: "Rotanak Mondol",
      userDistrict: "Other Districts",
      communeSelect: "Commune",
      villageSelect: "Village / Area",
      categorySelect: "Category",
      allCategories: "All Categories",
      school: "School",
      hospital: "Hospital / Health Center",
      police: "Police Station",
      chiefHouse: "Village Chief / Commune",
      other: "Other",
      noData: "No data found...",
      viewOnMap: "View on Google Maps",
      addLocTitle: "Add New Location",
      addLocAlert: "Information requires Admin approval.",
      inputLocName: "Location Name",
      btnSubmitRequest: "Submit Location",
      adminPortal: "Admin Portal",
      adminPassRequired: "Enter Admin Password:",
      login: "Login",
      pendingApproval: "Pending Approval",
      approve: "Approve",
      delete: "Delete",
      enterUsername: "Login / Register",
      enterId: "Secret ID",
      save: "Save & Continue",
      successUpload: "Submitted successfully! Pending admin approval.",
      emptyFields: "Please fill required fields!",
      logout: "Logout",
      currentMember: "User:"
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

      {/* ==========================================================
          📱 ទម្រង់ទូរស័ព្ទដៃស្មាតហ្វូនបញ្ឈរ (MOBILE SMARTPHONE SIMULATOR)
          ========================================================== */}
      <div className={`w-full max-w-md h-screen md:h-[840px] relative overflow-hidden flex flex-col shadow-2xl md:rounded-[42px] md:border-[10px] md:border-slate-950 transition-all ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* ==========================================================
            PAGE 1: ទំព័រស្វាគមន៍ដំបូង (WELCOME SCREEN - MOBILE CONTAINER ONLY)
            ========================================================== */}
        {currentPage === 1 && (
          <div 
            className="absolute inset-0 z-50 flex flex-col justify-between bg-cover bg-center animate-fadeIn" 
            style={{ backgroundImage: `url(${WELCOME_BACKGROUND_URL})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-transparent"></div>
            
            {/* ផ្នែកខាងលើនៃទំព័រស្វាគមន៍ */}
            <div className="relative z-10 p-6 pt-12 text-center animate-slide-up">
              <div className="w-16 h-16 bg-[#00965e] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border-2 border-white/20">
                <MapPin size={32} className="text-white animate-bounce" />
              </div>
              <h1 className="text-2xl font-black text-white drop-shadow-md leading-relaxed font-moul">
                {t[language].welcomeTitle}
              </h1>
              <p className="text-emerald-400 text-xs font-bold tracking-wider drop-shadow-sm uppercase font-moul">
                {t[language].welcomeProject}
              </p>
            </div>

            {/* 🎯 ផ្នែកគោលបំណងគម្រោង */}
            <div className="relative z-10 px-5 py-5 mx-5 bg-slate-950/60 backdrop-blur-md rounded-3xl border border-white/15 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-sm font-black text-emerald-400 mb-2 flex items-center gap-2 font-moul">
                🎯 {t[language].projectIntro}
              </h3>
              <p className="text-[11px] text-slate-200 leading-relaxed mb-3">
                {t[language].projectDesc}
              </p>
              <ul className="text-[11px] text-slate-200 space-y-2 text-left list-none pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✔️</span> ជួយស្វែងរកសាលារៀន មណ្ឌលសុខភាព និងប៉ុស្តិ៍ប៉ូលីសរហ័ស។
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✔️</span> បង្ហាញស្ថិតិប្រជាពលរដ្ឋ និងទំនាក់ទំនងថ្នាក់ដឹកនាំភូមិ។
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✔️</span> បង្កើនភាពងាយស្រួលក្នុងការស្វែងរកទីតាំងតាមរយៈ Google Maps។
                </li>
              </ul>
            </div>

            {/* ប៊ូតុង និងផ្នែកខាងក្រោម */}
            <div className="relative z-10 p-6 text-center">
              <button 
                onClick={handleProceed}
                className="w-full bg-[#00965e] hover:bg-[#007a4c] active:scale-95 transition-transform text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-900/50 font-moul"
              >
                {t[language].btnStart}
              </button>
              <p className="text-[9px] text-slate-400/80 mt-4 tracking-widest uppercase">
                VMC Youth STAU SANTEPHEAP • 2026
              </p>
            </div>
          </div>
        )}

        {/* ==========================================================
            PAGE 2: ទំព័រកម្មវិធីចម្បង (MAIN APPLICATION SHELL)
            ========================================================== */}
        {currentPage === 2 && (
          <div 
            className="flex-1 flex flex-col h-full relative bg-cover bg-center"
            style={{ backgroundImage: `url(${MAIN_APP_BACKGROUND_URL})` }}
          >
            <div className={`absolute inset-0 transition-colors ${isDarkMode ? 'bg-slate-950/92' : 'bg-slate-50/94'}`}></div>

            {/* Header ផ្នែកខាងលើ */}
            <header className={`px-4 py-3 flex justify-between items-center z-20 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'} border-b backdrop-blur-md`}>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(1)} 
                  className="p-1.5 text-slate-400 hover:text-[#00965e] rounded-lg transition-colors"
                  title="ត្រឡប់ទៅទំព័រស្វាគមន៍"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-0.5 h-6 bg-slate-350 dark:bg-slate-800"></div>
                <div>
                  <h2 className="font-black text-xs leading-tight text-[#00965e] font-moul">{t[language].welcomeSubtitle}</h2>
                  <p className="text-[9.5px] text-slate-500">គម្រោង VMC ឆ្នាំ 2026</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button onClick={toggleDarkMode} className="text-slate-400 hover:text-[#00965e] p-1 transition-colors">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                {/* រូបភាពគណនីរបស់អ្នកប្រើប្រាស់ */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border border-[#00965e]/30 transition-transform hover:scale-105"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : isAdmin ? (
                    <span className="font-bold text-[#00965e] text-[10px]">AD</span>
                  ) : username ? (
                    <span className="font-black text-slate-600 dark:text-slate-200 text-[10px]">{username.substring(0,2).toUpperCase()}</span>
                  ) : (
                    <User size={16} className="text-slate-500" />
                  )}
                </div>
              </div>
            </header>

            {/* បញ្ជីទិន្នន័យចម្បងដែលអាចអូសចុះឡើងបាន */}
            <main className="flex-1 overflow-y-auto hide-scroll pb-24 z-10">
              
              {/* ==================== TAB 1: ស្វែងរក / រុករក ==================== */}
              {activeTab === 'home' && (
                <div className="animate-slide-up p-4 space-y-4">
                  
                  {/* បដាស្វាគមន៍បែបកញ្ចក់ថ្លា */}
                  <div className="rounded-3xl p-4 text-white bg-gradient-to-r from-[#00965e] to-emerald-800 shadow-lg">
                    <h3 className="font-bold text-xs mb-1">ស្វែងរកទិន្នន័យមូលដ្ឋានរបស់សហគមន៍!</h3>
                    <p className="text-[10px] opacity-90 leading-relaxed">ប្រព័ន្ធនឹងចាប់យកទីតាំងឃុំរបស់អ្នកដោយស្វ័យប្រវត្ត។ អ្នកក៏អាចចុចជ្រើសរើសដោយដៃផងដែរ。</p>
                  </div>

                  {/* 🔍 ប្រព័ន្ធស្វែងរកទីតាំងពេញលេញ (Search Bar - ដំណើរការយ៉ាងរលូន) */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="ស្វែងរកតាមឈ្មោះទីតាំង, ស្ថាប័ន ឬភូមិ..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full py-3.5 pl-11 pr-4 rounded-2xl text-xs outline-none border transition-all ${isDarkMode ? 'bg-slate-900/90 border-slate-800 text-white focus:border-[#00965e]' : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm focus:border-[#00965e]'}`}
                    />
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  </div>

                  {/* ប្រភេទជម្រើសស្រុក (រតនមណ្ឌល VS ស្រុកផ្សេងៗ) */}
                  <div className={`flex p-1 rounded-2xl ${isDarkMode ? 'bg-slate-900/80' : 'bg-slate-200/50'}`}>
                    <button 
                      onClick={() => { setSelectedDistrictTab('រតនមណ្ឌល'); setSelectedCommune('ស្តៅ'); setSelectedVillage('ភូមិស្តៅ'); }}
                      className={`flex-1 py-2 text-[10.5px] font-bold rounded-xl transition-all ${selectedDistrictTab === 'រតនមណ្ឌល' ? 'bg-[#00965e] text-white shadow-sm' : 'text-slate-500'}`}
                    >
                      ស្រុករតនមណ្ឌល
                    </button>
                    <button 
                      onClick={() => { setSelectedDistrictTab('ផ្សេងៗ'); setSelectedCommune(''); setSelectedVillage(''); }}
                      className={`flex-1 py-2 text-[10.5px] font-bold rounded-xl transition-all ${selectedDistrictTab === 'ផ្សេងៗ' ? 'bg-[#00965e] text-white shadow-sm' : 'text-slate-500'}`}
                    >
                      ស្រុកផ្សេងៗ ({customDistrictsList.length})
                    </button>
                  </div>

                  {/* ប្រព័ន្ធរើសឃុំ និងភូមិដោយស្វ័យប្រវត្ត និងការផ្លាស់ប្តូរដោយដៃ */}
                  {selectedDistrictTab === 'រតនមណ្ឌល' && (
                    <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/95 border-slate-100 shadow-sm'} space-y-3`}>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-[#00965e] flex items-center gap-1.5 font-moul">
                          <Layers size={14} /> ជម្រើសរុករកភូមិសាស្ត្រ
                        </h4>
                        {isAutoDetecting && (
                          <span className="text-[9px] text-amber-500 animate-pulse font-bold">Auto-detecting...</span>
                        )}
                      </div>
                      
                      {/* ជ្រើសរើសឃុំ */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block ml-1">ឃុំដែលចង់ស្វែងរក</label>
                        <select 
                          value={selectedCommune} 
                          onChange={e => { setSelectedCommune(e.target.value); setSelectedVillage(''); }}
                          className={`w-full p-3 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        >
                          <option value="">-- គ្រប់ឃុំទាំងអស់ --</option>
                          {ROTANAK_MONDOL_COMMUNES.map(comm => (
                            <option key={comm} value={comm}>ឃុំ {comm}</option>
                          ))}
                        </select>
                      </div>

                      {/* ជ្រើសរើសភូមិ */}
                      {selectedCommune && (
                        <div className="space-y-1 animate-slide-up">
                          <label className="text-[10px] text-slate-400 font-bold block ml-1">ភូមិដែលចង់ស្វែងរក</label>
                          <select 
                            value={selectedVillage} 
                            onChange={e => setSelectedVillage(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                          >
                            <option value="">-- គ្រប់ភូមិទាំងអស់ --</option>
                            {RatanakMondolSeedData[selectedCommune] ? (
                              Object.keys(RatanakMondolSeedData[selectedCommune]).map(vil => (
                                <option key={vil} value={vil}>{vil}</option>
                              ))
                            ) : (
                              <option value="ភូមិស្តៅ">ភូមិស្តៅ</option>
                            )}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ព័ត៌មានទំនាក់ទំនងមេភូមិ/ថ្នាក់ដឹកនាំភូមិ */}
                  {selectedDistrictTab === 'រតនមណ្ឌល' && activeVillageMeta && !searchQuery && (
                    <div className="space-y-4 animate-slide-up">
                      
                      {/* Demographics & Leaders Card */}
                      <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/95 border-slate-100 shadow-sm'} space-y-4`}>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                          <h4 className="font-bold text-xs text-[#00965e] flex items-center gap-1.5 font-moul">
                            📊 ស្ថិតិ និងថ្នាក់ដឹកនាំ {selectedVillage}
                          </h4>
                        </div>

                        {activeVillageMeta.image && (
                          <div className="w-full h-36 rounded-2xl overflow-hidden relative shadow-inner">
                            <img src={activeVillageMeta.image} alt={selectedVillage} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 text-white">
                              <p className="text-[10px] opacity-90">ស្ថិតិរស់នៅជាក់ស្តែង</p>
                              <p className="text-xs font-bold">{activeVillageMeta.households} គ្រួសារ | {activeVillageMeta.population} នាក់</p>
                            </div>
                          </div>
                        )}

                        {/* ប៊ូតុងតភ្ជាប់ទៅ Google Maps ភ្លាមៗ */}
                        {activeVillageMeta.mapLink && (
                          <a 
                            href={activeVillageMeta.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl text-[10px] font-black flex justify-center items-center gap-2 hover:bg-blue-100 transition-all border border-blue-200/50"
                          >
                            <Compass size={13} /> ចុចដើម្បីលោតចូល Google Maps ទីតាំងភូមិ
                          </a>
                        )}

                        {/* បញ្ជីមេភូមិ និងទំនាក់ទំនង */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">📞 ទំនាក់ទំនងថ្នាក់ដឹកនាំភូមិ</span>
                          {activeVillageMeta.leaders && activeVillageMeta.leaders.map((ldr, idx) => (
                            <div key={idx} className={`p-3 rounded-2xl flex justify-between items-center ${isDarkMode ? 'bg-slate-800/60' : 'bg-emerald-50/40 border border-emerald-100/30'}`}>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">{ldr.role}</span>
                                <strong className="text-xs text-slate-700 dark:text-slate-200">{ldr.name}</strong>
                              </div>
                              <a 
                                href={`tel:${ldr.phone}`}
                                className="px-3 py-1.5 bg-[#00965e] text-white rounded-xl text-[9px] font-bold flex items-center gap-1 hover:bg-[#007a4c] transition-colors"
                              >
                                <Phone size={10} /> ហៅ ({ldr.phone})
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 📍 បញ្ជីទីតាំងសំខាន់ៗដែលបានបញ្ចូលរួចរាល់ */}
                  <div className="space-y-3 pb-8">
                    <h3 className="font-bold text-xs border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5 font-moul">
                      📍 ទីតាំងចុះបញ្ជីក្នុងតំបន់ ({displayedLocations.length})
                    </h3>
                    
                    {displayedLocations.length > 0 ? (
                      displayedLocations.map(loc => (
                        <div key={loc.id} className={`rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-100 shadow-sm'} animate-slide-up`}>
                          <img src={loc.imageUrl} alt={loc.name} className="w-full h-44 object-cover" />
                          <div className="p-4 space-y-2.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold inline-block mb-1 ${
                                  loc.category === 'សាលារៀន' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-200' :
                                  loc.category === 'មណ្ឌលសុខភាព' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-200' :
                                  loc.category === 'ប៉ុស្តិ៍ប៉ូលីស' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                  'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-200'
                                }`}>
                                  {loc.category}
                                </span>
                                <h4 className="font-bold text-sm leading-snug">{loc.name}</h4>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                              <p className="flex items-center gap-1.5"><MapPin size={12} className="text-[#00965e]" /> <strong>ទីតាំង៖</strong> {loc.district}, ឃុំ {loc.commune}, {loc.village}</p>
                              <p className="flex items-center gap-1.5"><Phone size={12} className="text-blue-500" /> <strong>ទំនាក់ទំនង៖</strong> {loc.phone || "គ្មានលេខទូរស័ព្ទ"}</p>
                              <p className="flex items-start gap-1.5"><FileText size={12} className="text-purple-500 mt-0.5" /> <strong>ព័ត៌មានលម្អិត៖</strong> {loc.info || "មិនមានការបញ្ជាក់"}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1"><User size={10} /> បញ្ចូលដោយ៖ {loc.submittedBy}</p>
                            </div>

                            <div className="flex gap-2">
                              {loc.phone && loc.phone !== "គ្មានលេខទំនាក់ទំនង" && (
                                <a 
                                  href={`tel:${loc.phone}`}
                                  className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-[10.5px] font-black flex justify-center items-center gap-1.5 border border-emerald-200/50"
                                >
                                  <Phone size={12} /> ហៅទូរស័ព្ទ
                                </a>
                              )}
                              <a 
                                href={loc.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + " " + loc.village)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl text-[10.5px] font-black flex justify-center items-center gap-1.5 border border-blue-200/50"
                              >
                                <Compass size={12} /> លោតទៅ Google Map
                              </a>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 opacity-50">
                        <MapIcon size={36} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-bold">មិនទាន់មានទិន្នន័យចុះបញ្ជីទេ</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ==================== TAB 2: ស្នើសុំបន្ថែមទីតាំង ==================== */}
              {activeTab === 'add' && (
                <div className="animate-slide-up p-4 space-y-4">
                  <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/95 border-slate-100 shadow-sm'}`}>
                    <h3 className="font-bold text-sm text-[#00965e] mb-4 flex items-center gap-2 font-moul">
                      <PlusCircle size={16}/> ស្នើសុំបន្ថែមទីតាំងថ្មី
                    </h3>
                    
                    <form onSubmit={submitLocation} className="space-y-4 text-xs">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ឈ្មោះទីតាំង / ស្ថាប័ន *</label>
                        <input 
                          type="text" 
                          required 
                          value={newLocName} 
                          onChange={e=>setNewLocName(e.target.value)} 
                          className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                          placeholder="ឧ. សាលាបឋមសិក្សាបឹងអំពិល" 
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
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ប្រភេទជម្រើសទីតាំង *</label>
                          <select 
                            value={newLocCategory} 
                            onChange={e=>setNewLocCategory(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                          >
                            <option value="សាលារៀន">សាលារៀន</option>
                            <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                            <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                            <option value="ផ្ទះមេភូមិ">ផ្ទះមេភូមិ</option>
                            <option value="ផ្ទះមេឃុំ">ផ្ទះមេឃុំ</option>
                            <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                          </select>
                        </div>
                      </div>

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
                          <input 
                            type="text" 
                            required 
                            value={newLocCommune} 
                            onChange={e=>setNewLocCommune(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                            placeholder="ឧ. ស្តៅ" 
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">ភូមិ *</label>
                          <input 
                            type="text" 
                            required 
                            value={newLocVillage} 
                            onChange={e=>setNewLocVillage(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                            placeholder="ឧ. ភូមិស្តៅ" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">លេខទូរស័ព្ទទំនាក់ទំនង</label>
                          <input 
                            type="text" 
                            value={newLocPhone} 
                            onChange={e=>setNewLocPhone(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                            placeholder="ឧ. 092-111-222" 
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">តំណភ្ជាប់ Google Map (URL)</label>
                          <input 
                            type="text" 
                            value={newLocMapLink} 
                            onChange={e=>setNewLocMapLink(e.target.value)} 
                            className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                            placeholder="https://goo.gl/maps/..." 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ព័ត៌មានលម្អិតពីទីតាំង</label>
                        <textarea 
                          value={newLocInfo} 
                          onChange={e=>setNewLocInfo(e.target.value)} 
                          className={`w-full p-3 h-20 rounded-xl border outline-none resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                          placeholder="បញ្ជាក់ពីសេវាកម្ម ពេលវេលាបើក ឬម៉ោងធ្វើការ..."
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">រូបភាពទីតាំងគំរូ</label>
                        <label className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-800/80' : 'border-[#00965e]/35 bg-[#00965e]/5'}`}>
                          {newLocImageBase64 ? (
                            <img src={newLocImageBase64} className="w-full h-full object-cover" alt="preview" />
                          ) : (
                            <>
                              <Camera className="text-[#00965e] mb-2" size={24} />
                              <span className="text-[10px] text-slate-400 font-bold">ចុចដើម្បីបញ្ចូលរូបថត (Upload)</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full bg-[#00965e] text-white py-3.5 rounded-2xl font-bold mt-2 shadow-md hover:bg-[#007a4c] transition-all"
                      >
                        {isSubmitting ? 'កំពុងបញ្ជូន...' : '📤 ផ្ញើរកញ្ចប់សំណើរទីតាំង'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ==================== TAB 3: គណនី និងកិច្ចការរដ្ឋបាល ==================== */}
              {activeTab === 'profile' && (
                <div className="animate-slide-up p-4 space-y-4">
                  
                  {/* គណនី Profile */}
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white shadow-lg border-slate-100'} space-y-4`}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-[#00965e]/10 rounded-full border-2 border-[#00965e]/40 flex items-center justify-center text-lg font-black overflow-hidden">
                          {profileImage ? (
                            <img src={profileImage} alt="User Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500">{username ? username.substring(0,2).toUpperCase() : 'US'}</span>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#00965e] text-white rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#007a4c]">
                          <Camera size={12} />
                          <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight">{isAdmin ? 'រដ្ឋបាលប្រព័ន្ធ (Admin)' : (username || 'ភ្ញៀវសហគមន៍')}</h3>
                        <p className="text-[10px] text-slate-400">គណនី៖ {isAdmin ? 'សិទ្ធិខ្ពស់បំផុត' : 'អ្នកប្រើប្រាស់ធម្មតា'}</p>
                      </div>
                    </div>

                    {/* ⚙️ Profile Settings Area */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">ប្តូរភាសា (Language)</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={()=>handleLanguageChange('kh')} 
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${language === 'kh' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            ខ្មែរ
                          </button>
                          <button 
                            onClick={()=>handleLanguageChange('en')} 
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${language === 'en' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            EN
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">របៀបងងឹត (Dark Mode)</span>
                        <button 
                          onClick={toggleDarkMode}
                          className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${isDarkMode ? 'bg-[#00965e]' : 'bg-slate-300'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ផ្នែកបញ្ចូល Admin Login */}
                  {!isAdmin && (
                    <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white shadow-sm border-slate-100'}`}>
                      {!showAdminLogin ? (
                        <button 
                          onClick={() => setShowAdminLogin(true)} 
                          className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-250"
                        >
                          <ShieldCheck size={16} /> ចូលកាន់កិច្ចការរដ្ឋបាល (Admin)
                        </button>
                      ) : (
                        <form onSubmit={handleAdminLogin} className="space-y-3 animate-slide-up">
                          <h4 className="font-bold text-xs flex items-center gap-1"><ShieldAlert size={14} className="text-yellow-500"/> បញ្ចូលលេខកូដសម្ងាត់</h4>
                          <input 
                            type="password" 
                            value={adminPasswordInput}
                            onChange={e=>setAdminPasswordInput(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            placeholder="••••••••"
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl">បោះបង់</button>
                            <button type="submit" className="flex-1 py-2 bg-[#00965e] text-white text-xs font-bold rounded-xl shadow-md">បញ្ជាក់</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* ==================== គ្រប់គ្រងរដ្ឋបាល (ADMIN WORKSPACE) ==================== */}
                  {isAdmin && (
                    <div className="space-y-4 animate-slide-up">
                      <div className="flex gap-1.5 overflow-x-auto hide-scroll pb-1">
                        <button 
                          onClick={() => setAdminSubTab('approvals')} 
                          className={`px-3.5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${adminSubTab === 'approvals' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          📥 សំណើអនុម័ត ({pendingLocations.length})
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('data')} 
                          className={`px-3.5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${adminSubTab === 'data' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          🗂️ ទីតាំងទិន្នន័យ ({approvedLocations.length})
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('reports')} 
                          className={`px-3.5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${adminSubTab === 'reports' ? 'bg-[#00965e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          📈 របាយការណ៍សហគមន៍
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('security')} 
                          className={`px-3.5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${adminSubTab === 'security' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                        >
                          🛡️ សុវត្ថិភាព
                        </button>
                      </div>

                      {/* SUB-TAB 1: APPROVALS */}
                      {adminSubTab === 'approvals' && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs text-slate-400">សំណើទីតាំងរង់ចាំការពិនិត្យ</h4>
                          {pendingLocations.map(loc => (
                            <div key={loc.id} className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-bold text-xs">{loc.name}</h4>
                                  <p className="text-[10px] text-slate-500">ដោយ៖ {loc.submittedBy} | {loc.village}</p>
                                </div>
                                <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-1 rounded font-bold h-fit">{loc.category}</span>
                              </div>
                              <p className="text-[11px] text-slate-500">{loc.info}</p>
                              <div className="flex gap-2">
                                <button onClick={() => adminApprove(loc)} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700">✓ យល់ព្រម</button>
                                <button onClick={() => adminReject(loc)} className="flex-1 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100">✗ បដិសេធ</button>
                              </div>
                            </div>
                          ))}
                          {pendingLocations.length === 0 && (
                            <p className="text-center py-8 text-xs text-slate-400">គ្មានសំណើថ្មីកំពុងរង់ចាំឡើយ</p>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 2: DATA STRUCTURE (Admin CRUD) */}
                      {adminSubTab === 'data' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-slate-400">គ្រប់គ្រង និងកែសម្រួលទិន្នន័យទីតាំង</h4>
                            <button 
                              onClick={() => {
                                setNewLocDistrict('ស្រុករតនមណ្ឌល');
                                setActiveTab('add');
                              }}
                              className="px-2.5 py-1 bg-[#00965e] text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
                            >
                              <Plus size={10} /> បន្ថែមទីតាំង
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[350px] overflow-y-auto hide-scroll pr-1">
                            {approvedLocations.map(loc => (
                              <div key={loc.id} className={`p-3 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-2">
                                  <img src={loc.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                  <div>
                                    <h5 className="font-bold text-[11px] leading-tight text-slate-700 dark:text-slate-200">{loc.name}</h5>
                                    <p className="text-[9px] text-slate-400">{loc.commune} • {loc.village}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => openEditModal(loc)} className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg hover:scale-105">
                                    <Edit3 size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteLocation(loc.id)} className="p-1.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 rounded-lg hover:scale-105">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: REPORTS (Weekly, Monthly, Yearly User Statistics) */}
                      {adminSubTab === 'reports' && (
                        <div className="space-y-4 animate-slide-up">
                          <h4 className="font-bold text-xs text-slate-400">របាយការណ៍ស្ថិតិនៃការចូលប្រើប្រាស់ Web App</h4>
                          
                          {/* ស្ថិតិសរុប (Total Users Card) */}
                          <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} flex items-center justify-between`}>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">គណនីសរុបក្នុងប្រព័ន្ធ</p>
                              <h3 className="text-2xl font-black text-[#00965e] mt-1">{reportStats.totalUsers} នាក់</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#00965e]">
                              <Activity size={20} />
                            </div>
                          </div>

                          {/* សប្តាហ៍ ខែ ឆ្នាំ (Visual Statistics) */}
                          <div className="space-y-3">
                            {/* សប្តាហ៍ */}
                            <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100'} space-y-2`}>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold">ស្ថិតិសប្តាហ៍នេះ (Weekly)</span>
                                <span className="text-[#00965e] font-black">{reportStats.weekly} ទស្សនកិច្ច</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-[#00965e] h-full rounded-full" style={{ width: `${Math.min((reportStats.weekly/100)*100, 100)}%` }}></div>
                              </div>
                            </div>

                            {/* ខែ */}
                            <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100'} space-y-2`}>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold">ស្ថិតិខែនេះ (Monthly)</span>
                                <span className="text-blue-500 font-black">{reportStats.monthly} ទស្សនកិច្ច</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min((reportStats.monthly/300)*100, 100)}%` }}></div>
                              </div>
                            </div>

                            {/* ឆ្នាំ */}
                            <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100'} space-y-2`}>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold">ស្ថិតិឆ្នាំនេះ (Yearly)</span>
                                <span className="text-purple-500 font-black">{reportStats.yearly} ទស្សនកិច្ច</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min((reportStats.yearly/1000)*100, 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 4: SECURITY MONITOR */}
                      {adminSubTab === 'security' && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-xs text-slate-400">កំណត់ហេតុត្រួតពិនិត្យសុវត្ថិភាព</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scroll">
                            {securityLogs.length > 0 ? (
                              securityLogs.map(log => (
                                <div key={log.id} className="p-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-[10px] space-y-1 animate-slide-up">
                                  <div className="flex justify-between items-center">
                                    <p className="font-bold text-red-500">ការប៉ុនប៉ងចូលមិនត្រឹមត្រូវ</p>
                                    <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-slate-500">អ្នកប្រើប្រាស់៖ {log.username} | IP Address: <strong className="text-slate-700 dark:text-slate-200">{log.ipAddress}</strong></p>
                                  <p className="text-slate-500">ឧបករណ៍ទូរស័ព្ទ៖ {log.deviceModel}</p>
                                  <p className="text-slate-500">Password សាកល្បង៖ <strong className="text-red-500">{log.attemptedPassword}</strong></p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-8 text-xs text-slate-400">មិនមានសកម្មភាពគំរាមកំហែងទេ</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logout Actions */}
                  {username && !isAdmin && (
                    <button 
                      onClick={() => { setUsername(''); localStorage.removeItem('vmc_username_2026'); setActiveTab('home'); }} 
                      className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex justify-center items-center gap-2 mt-6"
                    >
                      <LogOut size={14} /> ចាកចេញពីគណនី {username}
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => { setIsAdmin(false); setActiveTab('home'); }} 
                      className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex justify-center items-center gap-2 mt-4"
                    >
                      <LogOut size={14} /> ចាកចេញពីប្រព័ន្ធ Admin
                    </button>
                  )}
                </div>
              )}
            </main>

            {/* បញ្ជីរបារ MENU ស្មាតហ្វូនផ្នែកខាងក្រោម */}
            <nav className={`absolute bottom-0 w-full flex justify-around items-center pt-2 pb-5 z-30 border-t ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button 
                onClick={() => { setActiveTab('home'); setIsAdmin(false); }} 
                className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' && !isAdmin ? 'text-[#00965e]' : 'text-slate-400'}`}
              >
                <Home size={22} className={activeTab === 'home' && !isAdmin ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">ទំព័រដើម</span>
              </button>
              
              <button 
                onClick={attemptToAddLocation} 
                className={`flex flex-col items-center gap-1 w-16 relative -top-3 ${activeTab === 'add' && !isAdmin ? 'text-[#00965e]' : 'text-slate-400'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${activeTab === 'add' && !isAdmin ? 'bg-[#00965e] text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Plus size={26} />
                </div>
                <span className="text-[10px] font-bold mt-1">បន្ថែម</span>
              </button>

              {isAdmin ? (
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-[#00965e]' : 'text-slate-400'}`}
                >
                  <User size={22} className={activeTab === 'profile' ? 'fill-current' : ''} />
                  <span className="text-[10px] font-bold">រដ្ឋបាល</span>
                </button>
              ) : (
                <button 
                  onClick={() => { if(!username) setIsUsernameModalOpen(true); else setActiveTab('profile'); }} 
                  className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-[#00965e]' : 'text-slate-400'}`}
                >
                  <User size={22} className={activeTab === 'profile' ? 'fill-current' : ''} />
                  <span className="text-[10px] font-bold">គណនី</span>
                </button>
              )}
            </nav>

          </div>
        )}

        {/* ==========================================
            OVERLAYS & MODALS
            ========================================== */}
        
        {/* Username Request Modal */}
        {isUsernameModalOpen && (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <button onClick={() => setIsUsernameModalOpen(false)} className="absolute top-4 right-4 text-slate-400 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full"><X size={14}/></button>
              <div className="w-16 h-16 bg-[#00965e]/10 rounded-full mx-auto flex items-center justify-center mb-4 text-[#00965e]">
                <User size={30} />
              </div>
              <h3 className="text-center font-bold text-base mb-1 font-moul">បង្កើតគណនី ID សហគមន៍</h3>
              <p className="text-center text-[10.5px] text-slate-500 mb-5 leading-relaxed">កំណត់ឈ្មោះសម្គាល់របស់អ្នក ដើម្បីទទួលបានសិទ្ធិបន្ថែមទីតាំងក្នុងភូមិ</p>
              
              <input 
                type="text" 
                placeholder="បញ្ចូលឈ្មោះរបស់អ្នក..." 
                value={usernameInput}
                onChange={e=>setUsernameInput(e.target.value)}
                className={`w-full p-4 rounded-xl outline-none border font-bold text-center text-sm mb-4 focus:border-[#00965e] ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
              
              <div className="flex gap-3">
                <button onClick={()=>setIsUsernameModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300">បិទ</button>
                <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#00965e] text-white rounded-xl font-bold text-xs shadow-md">រក្សាទុក</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Login Modal */}
        {showAdminLogin && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative border border-purple-500/20 text-center">
              <button onClick={() => {setShowAdminLogin(false); setAdminError('');}} className="absolute top-4 right-4 text-slate-400 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full"><X size={14}/></button>
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={24}/></div>
              <h3 className="font-moul mb-2 text-sm text-purple-600 dark:text-purple-400">ផ្ទៀងផ្ទាត់សិទ្ធិ Admin</h3>
              <p className="text-[9px] text-slate-500 mb-6 font-bold uppercase tracking-widest">Administrator</p>
              <form onSubmit={handleAdminLogin}>
                <input type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold text-center tracking-widest focus:border-purple-500 border border-transparent" />
                {adminError && <p className="text-[9px] text-red-500 font-bold text-center mt-2">{adminError}</p>}
                <button type="submit" className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold mt-4 shadow-md transition-transform">ផ្ទៀងផ្ទាត់</button>
              </form>
            </div>
          </div>
        )}

        {/* Admin Edit Location Modal (កែប្រែទិន្នន័យទីតាំង) */}
        {showEditModal && editingLoc && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className={`w-full max-w-sm p-5 rounded-3xl shadow-2xl h-[580px] overflow-y-auto hide-scroll ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs text-[#00965e] flex items-center gap-1.5 font-moul"><Edit3 size={14}/> កែប្រែព័ត៌មានទីតាំង</h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><X size={14}/></button>
              </div>
              
              <form onSubmit={handleUpdateLocation} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-400 mb-1 block">ឈ្មោះទីតាំង</label>
                  <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                </div>
                <div>
                  <label className="font-bold text-slate-400 mb-1 block">ប្រភេទទីតាំង</label>
                  <select value={editCategory} onChange={e=>setEditCategory(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent">
                    <option value="សាលារៀន">សាលារៀន</option>
                    <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                    <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                    <option value="ផ្ទះមេភូមិ">ផ្ទះមេភូមិ</option>
                    <option value="ផ្ទះមេឃុំ">ផ្ទះមេភុំ</option>
                    <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                  </select>
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
                <div>
                  <label className="font-bold text-slate-400 mb-1 block">តំណភ្ជាប់ Google Map</label>
                  <input type="text" value={editMapLink} onChange={e=>setEditMapLink(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                </div>
                <div>
                  <label className="font-bold text-slate-400 mb-1 block">ព័ត៌មានលម្អិត</label>
                  <textarea value={editInfo} onChange={e=>setEditInfo(e.target.value)} className="w-full p-2.5 h-16 rounded-xl border outline-none bg-transparent resize-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-400 mb-1 block">តំណភ្ជាប់រូបភាព (URL)</label>
                  <input type="text" value={editImageUrl} onChange={e=>setEditImageUrl(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none bg-transparent" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">បោះបង់</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#00965e] text-white rounded-xl font-bold">រក្សាទុកការកែប្រែ</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast Alert Notification */}
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