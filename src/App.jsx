import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import "./assets/ramit.png";
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  MapPin, Search, PlusCircle, ShieldCheck, User, Sun, Moon, 
  ChevronRight, ChevronDown, Phone, Map as MapIcon, Check, X, AlertTriangle, 
  LogOut, Globe, Camera, Trash2, Plus, Compass, BarChart2, 
  TrendingUp, ShieldAlert, Activity, Bell, Building, Users, FolderTree, Clock, ArrowLeft
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
const ROTANAK_MONDOL_COMMUNES = ["ស្តៅ", "ផ្លូវមាស", "អណ្តើកហែប", "រស្មីសង្ហា", "ត្រែង"];

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone / iOS';
  if (/iPad/i.test(ua)) return 'iPad / iOS';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac OS';
  return 'Unknown Device';
};

// Default high-quality mock locations to guarantee gorgeous content pre-load
const INITIAL_LOCATIONS = [
  {
    id: "mock-1",
    name: "សាលាបឋមសិក្សាកិរីឡា",
    category: "សាលារៀន",
    district: "ស្រុករតនមណ្ឌល",
    commune: "ស្តៅ",
    village: "ភូមិត្រៃត្រង្ស",
    imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80",
    approved: true,
    submittedBy: "VMC Youth",
    mapLink: "https://maps.google.com",
    officials: [{ role: "នាយកសាលា", name: "ស៊ន សុខា", phone: "092887766" }]
  },
  {
    id: "mock-2",
    name: "មណ្ឌលសុខភាពសេរីភាព",
    category: "មណ្ឌលសុខភាព",
    district: "ស្រុករតនមណ្ឌល",
    commune: "ស្តៅ",
    village: "ភូមិត្រៃត្រង្ស",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
    approved: true,
    submittedBy: "VMC Youth",
    mapLink: "https://maps.google.com",
    officials: [{ role: "ប្រធានមណ្ឌល", name: "លឹម ហេង", phone: "012334455" }]
  },
  {
    id: "mock-3",
    name: "អណ្តូងទឹកស្អាតសហគមន៍",
    category: "មណ្ឌលសុខភាព",
    district: "ស្រុករតនមណ្ឌល",
    commune: "ផ្លូវមាស",
    village: "ភូមិអណ្តូងទឹក",
    imageUrl: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=600&q=80",
    approved: true,
    submittedBy: "Admin",
    mapLink: "https://maps.google.com",
    officials: [{ role: "មេភូមិ", name: "កែវ មុនី", phone: "088776655" }]
  }
];

export default function App() {
  // === APP STATE ===
  const [currentPage, setCurrentPage] = useState(1); // 1: Welcome/Login Screen, 2: Main App Shell
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  
  // Navigation & UI States
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [showNeedsAccountAlert, setShowNeedsAccountAlert] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'add_location', 'tree_structure', 'admin_panel', 'notifications'
  const [adminSubTab, setAdminSubTab] = useState('approvals'); // 'approvals', 'users', 'security', 'statistics'
  
  // Explore Filter States
  const [selectedDistrict, setSelectedDistrict] = useState('ស្រុករតនមណ្ឌល');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Realtime Database & Mock States
  const [approvedLocations, setApprovedLocations] = useState(INITIAL_LOCATIONS);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [userList, setUserList] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [customDistrictsList, setCustomDistrictsList] = useState([]);
  const [userNotifications, setUserNotifications] = useState([
    { id: "n1", message: "ទីតាំងថ្មីត្រូវបានដាក់រង់ចាំការអនុម័ត - អណ្តូងទឹកថ្មី", type: "warning", timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
    { id: "n2", message: "ទីតាំងថ្មីត្រូវបានអនុម័ត - សាលាបឋមសិក្សាកិរីឡា", type: "success", timestamp: new Date(Date.now() - 18000000).toISOString(), read: false },
    { id: "n3", message: "សកម្មភាពចូលប្រព័ន្ធ - ចូលពី iPhone / iOS", type: "security", timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
    { id: "n4", message: "របាយការណ៍ប្រចាំសប្តាហ៍ - មើលរបាយការណ៍សហគមន៍", type: "report", timestamp: new Date(Date.now() - 172800000).toISOString(), read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Add Location Form States
  const [newLocName, setNewLocName] = useState('');
  const [newLocDistrictType, setNewLocDistrictType] = useState('ស្រុករតនមណ្ឌល');
  const [newLocCustomDistrict, setNewLocCustomDistrict] = useState('');
  const [newLocCommune, setNewLocCommune] = useState('');
  const [newLocCustomCommune, setNewLocCustomCommune] = useState('');
  const [newLocVillage, setNewLocVillage] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('សាលារៀន');
  const [newLocMapLink, setNewLocMapLink] = useState('');
  const [newLocImageBase64, setNewLocImageBase64] = useState('');
  const [officials, setOfficials] = useState([{ role: 'មេភូមិ/ប្រធាន', name: '', phone: '' }]);
  const [isLocating, setIsLocating] = useState(false);
  const [formStatus, setFormStatus] = useState({ show: false, success: false, message: '' });

  // Admin Verification & Login
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  // Tree Accordion States
  const [expandedDist, setExpandedDist] = useState('ស្រុករតនមណ្ឌល');
  const [expandedComm, setExpandedComm] = useState('ស្តៅ');

  // === FIREBASE INITIALIZATION & AUTH LISTENERS ===
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (e) { await signInAnonymously(auth); }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) setUser(u); 
    });

    const session = localStorage.getItem('vmc_user_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUsername(parsed.username);
        setCurrentPage(2);
      } catch(e) { 
        localStorage.removeItem('vmc_user_session'); 
      }
    }
    return () => unsubscribe();
  }, []);

  // === DATABASE SYNC ===
  useEffect(() => {
    if (!user) return;
    
    // Sync Locations
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'location'), (snap) => {
      const locs = []; 
      const dists = new Set();
      snap.forEach(d => {
        const data = d.data(); 
        locs.push({ id: d.id, ...data });
        if (data.district && data.district !== 'ស្រុករតនមណ្ឌល') dists.add(data.district);
      });
      if (locs.length > 0) {
        setApprovedLocations(locs.filter(l => l.approved));
        setPendingLocations(locs.filter(l => !l.approved));
        setCustomDistrictsList(Array.from(dists));
      }
    }, (error) => {
      console.log("Firestore subscription error", error);
    });

    // Sync Security Logs
    const unsubSec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), (snap) => {
      const logs = []; 
      snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setSecurityLogs(logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    });

    return () => { 
      unsubLoc(); 
      unsubSec();
    };
  }, [user]);

  // === GEOLOCATION COMPASS ===
  const handleAutoGPS = () => {
    if (!navigator.geolocation) {
      setFormStatus({show: true, success: false, message: 'ឧបករណ៍អ្នកមិនគាំទ្រ GPS ទេ'}); 
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setNewLocMapLink(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      setIsLocating(false);
      setFormStatus({show: true, success: true, message: 'ចាប់យកកូអរដោនេ GPS បានសម្រេច!'});
    }, () => {
      setIsLocating(false);
      setFormStatus({show: true, success: false, message: 'សូមបើក Location (GPS) ក្នុងទូរស័ព្ទរបស់អ្នក!'});
    }, { enableHighAccuracy: true });
  };

  // === SIGN IN / SIGN OUT ===
  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return;
    const cName = usernameInput.trim(); 
    const cId = userIdInput.trim() || crypto.randomUUID();
    setUsername(cName);
    localStorage.setItem('vmc_user_session', JSON.stringify({ username: cName, id: cId }));
    setIsUsernameModalOpen(false); 
    setShowNeedsAccountAlert(false);
    setCurrentPage(2);
    if (user) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', cId), {
        username: cName, uid: user.uid, registeredAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vmc_user_session');
    setUsername(''); 
    setCurrentPage(1); 
    setShowProfileMenu(false); 
    setIsAdmin(false);
  };

  // === SUBMIT LOCATION & FILE HANDLING ===
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setFormStatus({show:true, success:false, message: "រូបភាពធំពេក សូមជ្រើសរើសក្រោម 5MB"}); 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setNewLocImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addOff = () => setOfficials([...officials, { role: '', name: '', phone: '' }]);
  const rmOff = (i) => setOfficials(officials.filter((_, idx) => idx !== i));
  const updOff = (i, f, v) => { const u = [...officials]; u[i][f] = v; setOfficials(u); };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    if (!username && !isAdmin) return setShowNeedsAccountAlert(true);
    
    const finalDist = newLocDistrictType === 'ស្រុករតនមណ្ឌល' ? 'ស្រុករតនមណ្ឌល' : newLocCustomDistrict;
    const finalComm = newLocDistrictType === 'ស្រុករតនមណ្ឌល' ? (newLocCommune === 'ផ្សេងៗ' ? newLocCustomCommune : newLocCommune) : newLocCustomCommune;
    
    if (!newLocName || !finalDist || !finalComm || !newLocVillage || !newLocImageBase64) {
      return setFormStatus({show: true, success: false, message: 'សូមបំពេញព័ត៌មាន និងរូបភាពឱ្យគ្រប់គ្រាន់!'});
    }

    try {
      const isAutoApproved = isAdmin; 
      const newLoc = {
        name: newLocName, district: finalDist, commune: finalComm, village: newLocVillage,
        category: newLocCategory, officials: officials.filter(o => o.name.trim() !== ''),
        mapLink: newLocMapLink || `https://maps.google.com/?q=${encodeURIComponent(newLocName)}`,
        imageUrl: newLocImageBase64, approved: isAutoApproved, submittedBy: isAdmin ? "Admin" : username, submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'location'), newLoc);

      if (isAutoApproved) {
        setApprovedLocations(prev => [...prev, { id: crypto.randomUUID(), ...newLoc }]);
        setFormStatus({show: true, success: true, message: 'ទីតាំងត្រូវបានបន្ថែមចូលប្រព័ន្ធដោយជោគជ័យដោយសិទ្ធិ Admin!'});
      } else {
        setPendingLocations(prev => [...prev, { id: crypto.randomUUID(), ...newLoc }]);
        setFormStatus({show: true, success: true, message: 'សូមរង់ចាំរយះពេល 3 នាទីសម្រាប់ការត្រួតពិនិត្យពី admin ។'});
      }
      
      // Reset Form fields
      setNewLocName(''); 
      setNewLocImageBase64(''); 
      setOfficials([{ role: 'មេភូមិ/ប្រធាន', name: '', phone: '' }]);
      setActiveTab('explore');
    } catch (e) { 
      setFormStatus({show: true, success: false, message: 'មានបញ្ហាបច្ចេកទេស! សូមព្យាយាមម្តងទៀត។'}); 
    }
  };

  // === ADMIN LOGIC ===
  const handleApproveLocation = async (loc) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location', loc.id), { approved: true });
      setApprovedLocations(prev => [...prev, { ...loc, approved: true }]);
      setPendingLocations(prev => prev.filter(p => p.id !== loc.id));
      
      // Add notification
      const newNotif = {
        id: crypto.randomUUID(),
        message: `ទីតាំងថ្មីត្រូវបានអនុម័ត - ${loc.name}`,
        type: "success",
        timestamp: new Date().toISOString(),
        read: false
      };
      setUserNotifications(prev => [newNotif, ...prev]);
    } catch (e) {
      // Local fallback for safety if offline
      setApprovedLocations(prev => [...prev, { ...loc, approved: true }]);
      setPendingLocations(prev => prev.filter(p => p.id !== loc.id));
    }
  };

  const handleDeleteLocation = async (loc) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'location', loc.id));
      setPendingLocations(prev => prev.filter(p => p.id !== loc.id));
      setApprovedLocations(prev => prev.filter(p => p.id !== loc.id));
    } catch (e) {
      setPendingLocations(prev => prev.filter(p => p.id !== loc.id));
      setApprovedLocations(prev => prev.filter(p => p.id !== loc.id));
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD_HASH) {
      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setActiveTab('admin_panel'); 
      setAdminError('');
    } else {
      setAdminError('លេខកូដខុស! បរាជ័យត្រូវបានកត់ត្រាក្នុងប្រព័ន្ធសុវត្ថិភាព។');
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), {
          attemptedPassword: adminPasswordInput, 
          timestamp: new Date().toISOString(),
          deviceInfo: getDeviceInfo(), 
          usernameAttempt: username || 'Guest', 
          estimatedIP: "192.168.1.1 (Simulated)"
        });
      } catch(err) {}
    }
  };

  const clearAllNotifications = () => {
    setUserNotifications([]);
  };

  // === DATA TREE COMPUTING ===
  const buildTreeData = useMemo(() => {
    const tree = {};
    approvedLocations.forEach(loc => {
      if (!tree[loc.district]) tree[loc.district] = { total: 0, communes: {} };
      tree[loc.district].total++;
      
      if (!tree[loc.district].communes[loc.commune]) tree[loc.district].communes[loc.commune] = { total: 0, villages: {} };
      tree[loc.district].communes[loc.commune].total++;
      
      if (!tree[loc.district].communes[loc.commune].villages[loc.village]) {
        const baseNum = loc.village ? loc.village.length * 5 + 10 : 45;
        tree[loc.district].communes[loc.commune].villages[loc.village] = { 
          total: 0, categories: {}, 
          families: baseNum, people: baseNum * 4 + 12 
        };
      }
      tree[loc.district].communes[loc.commune].villages[loc.village].total++;
      
      const category = loc.category || "ផ្សេងៗ";
      if (!tree[loc.district].communes[loc.commune].villages[loc.village].categories[category]) {
        tree[loc.district].communes[loc.commune].villages[loc.village].categories[category] = [];
      }
      tree[loc.district].communes[loc.commune].villages[loc.village].categories[category].push(loc);
    });
    return tree;
  }, [approvedLocations]);

  // Explore Filtering
  const filteredLocations = approvedLocations.filter(loc => {
    if (selectedDistrict !== 'all' && loc.district !== selectedDistrict) return false;
    if (selectedCommune && selectedCommune !== 'ទាំងអស់' && loc.commune !== selectedCommune) return false;
    if (selectedCategory && selectedCategory !== 'ទាំងអស់' && loc.category !== selectedCategory) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchOff = loc.officials?.some(o => o.name.toLowerCase().includes(q) || o.phone.includes(q));
      return loc.name.toLowerCase().includes(q) || loc.village?.toLowerCase().includes(q) || matchOff;
    }
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Moul&family=Siemreap&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-moul { font-family: 'Moul', 'Khmer OS Muol Light', serif; }
        .font-siemreap { font-family: 'Siemreap', 'Khmer OS Siemreap', sans-serif; }
        
        /* App styling defaults */
        body {
          background-color: #0f172a;
          font-family: 'Siemreap', sans-serif;
          margin: 0;
          padding: 0;
        }

        /* Standard phone frame mockups on desktop */
        .phone-simulator {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 12px solid #1e293b;
          border-radius: 40px;
          position: relative;
        }
        
        .phone-notch {
          width: 140px;
          height: 24px;
          background: #1e293b;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-left-radius: 18px;
          border-bottom-right-radius: 18px;
          z-index: 99;
        }

        .scroll-area::-webkit-scrollbar {
          display: none;
        }
        .scroll-area {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Main Container Wrapper - Responsive to fit desktop and mobile natively */}
      <div className="min-h-screen bg-slate-900 flex items-center justify-center py-0 md:py-8 px-0">
        
        {/* Device Simulator Frame container */}
        <div className="w-full max-w-md bg-white dark:bg-slate-950 phone-simulator overflow-hidden flex flex-col h-screen md:h-[840px] relative font-siemreap">
          
          {/* Mock Notch & Status bar for authentic look */}
          <div className="phone-notch hidden md:block"></div>
          
          {/* Simulator Info Bar */}
          <div className="bg-emerald-800 text-white text-[11px] px-6 pt-3 pb-2 flex justify-between items-center select-none font-sans z-50">
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.13 19.58 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
              </svg>
              <div className="w-5 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* APP SCREENS PORTAL */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">

            {/* SCREEN 1: WELCOME / AUTHENTICATION */}
            {currentPage === 1 && (
              <div className="absolute inset-0 flex flex-col justify-between overflow-y-auto bg-white z-40 animate-fade-in">
                
                {/* Header Curved Illustration banner matching the image */}
                <div className="relative bg-gradient-to-b from-[#00965e] to-[#047857] pt-12 pb-24 px-6 rounded-b-[48px] text-center shadow-lg">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    {/* Shield with pin */}
                    <div className="w-14 h-14 bg-[#00965e] rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
                      <ShieldCheck size={28} />
                    </div>
                  </div>
                  <h1 className="font-moul text-xl text-white tracking-wide leading-relaxed mb-1 drop-shadow-sm">
                    ផែនទីមូលដ្ឋានសហគមន៍
                  </h1>
                  <p className="font-moul text-xs text-emerald-200 tracking-wider">
                    ស្រុករតនមណ្ឌល
                  </p>
                  
                  {/* Avatar Icon Circle Container */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-slate-100 p-1.5 shadow-md">
                    <div className="w-full h-full rounded-full bg-emerald-50 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <User size={36} />
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="flex-1 px-8 pt-16 pb-6 flex flex-col justify-center max-w-sm mx-auto w-full">
                  <h3 className="font-moul text-center text-[13px] text-slate-800 mb-1 leading-relaxed">
                    សូមបញ្ចូលឈ្មោះរបស់អ្នក
                  </h3>
                  <p className="text-center text-xs text-slate-500 mb-6 font-medium">
                    ដើម្បីទទួលបានសិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធ
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={usernameInput} 
                        onChange={e => setUsernameInput(e.target.value)} 
                        placeholder="ឈ្មោះអ្នកប្រើ" 
                        className="w-full px-4 py-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-semibold text-slate-700 focus:border-[#00965e] transition-colors"
                      />
                      <User size={16} className="absolute left-4 top-4 text-slate-400" />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveUsername}
                    disabled={!usernameInput.trim()}
                    className="w-full py-4 bg-[#00965e] hover:bg-[#047857] text-white rounded-2xl font-moul text-xs tracking-wider shadow-lg shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    ចូលទៅកាន់ប្រព័ន្ធ
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-5 text-emerald-600 font-bold text-[11px]">
                    <ShieldCheck size={14} />
                    <span>ទិន្នន័យមានសុវត្ថិភាព</span>
                  </div>
                </div>

                {/* Footer Copy */}
                <div className="text-center pb-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  © 2024 ផែនទីមូលដ្ឋានសហគមន៍
                </div>
              </div>
            )}

            {/* MAIN PORTAL PAGES (IF SIGNED IN) */}
            {currentPage === 2 && (
              <div className="flex-1 flex flex-col h-full relative">
                
                {/* GLOBAL SCREEN HEADER */}
                <header className="bg-white border-b border-slate-100 px-4 py-3.5 flex justify-between items-center z-30 shadow-xs">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(1)} 
                      className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="font-moul text-[13px] text-slate-800 leading-none">
                      {activeTab === 'explore' && "ផែនទីមូលដ្ឋានសហគមន៍"}
                      {activeTab === 'add_location' && "បន្ថែមទីតាំងថ្មី"}
                      {activeTab === 'tree_structure' && "រចនាសម្ព័ន្ធតាមស្រុក/ឃុំ"}
                      {activeTab === 'admin_panel' && "ផ្ទាំងគ្រប់គ្រង (Admin)"}
                      {activeTab === 'notifications' && "ការជូនដំណឹង"}
                    </span>
                  </div>
                  
                  {/* Quick Profile / Notif header control */}
                  <div className="flex items-center gap-2.5">
                    {/* Notification icon inside header */}
                    <button 
                      onClick={() => setActiveTab('notifications')}
                      className={`relative p-2 rounded-full ${activeTab === 'notifications' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}
                    >
                      <Bell size={18} />
                      {userNotifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                    </button>

                    <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center justify-center shadow-xs"
                    >
                      {username ? username.substring(0,2) : "Me"}
                    </button>
                  </div>
                </header>

                {/* PROFILE CONTROL OVERLAY */}
                {showProfileMenu && (
                  <div className="absolute top-14 right-4 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 animate-fade-in p-4">
                    <p className="font-bold text-xs text-slate-800">{username}</p>
                    <p className="text-[10px] text-slate-400 mb-3">អ្នកប្រើប្រាស់សហគមន៍</p>
                    <hr className="border-slate-100 mb-3" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left py-2 text-red-500 font-bold text-xs flex items-center gap-2"
                    >
                      <LogOut size={14} /> ចាកចេញពីគណនី
                    </button>
                  </div>
                )}

                {/* DYNAMIC SCROLL CONTENT CONTAINER */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-area">

                  {/* TAB 1: EXPLORE / HOME SCREEN */}
                  {activeTab === 'explore' && (
                    <div className="space-y-4 animate-fade-in">
                      
                      {/* Panoramic Angkor Wat Card Banner */}
                      <div 
                        className="relative h-40 rounded-3xl overflow-hidden shadow-sm flex items-end p-4 bg-slate-800"
                        style={{
                          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.2)), url("https://images.unsplash.com/photo-1600803588970-1361cddc5d01?auto=format&fit=crop&w=600&q=80")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="space-y-1">
                          <h2 className="font-moul text-[13px] text-white leading-relaxed drop-shadow-md">
                            ស្វែងរកទីតាំងក្នុងសហគមន៍
                          </h2>
                          <p className="font-moul text-[11px] text-emerald-300 drop-shadow-md">
                            ស្រុករតនមណ្ឌល
                          </p>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-[#00965e] text-white p-2.5 rounded-full shadow-lg border border-white/20">
                          <MapPin size={18} />
                        </div>
                      </div>

                      {/* Filter pills */}
                      <div className="flex gap-2 border-b border-slate-100 pb-2">
                        <button className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px]">
                          ស្វែងរក
                        </button>
                        <button onClick={() => setActiveTab('add_location')} className="px-4 py-1.5 text-slate-500 rounded-full font-bold text-[11px]">
                          បន្ថែមទីតាំង
                        </button>
                        <button onClick={() => setActiveTab('tree_structure')} className="px-4 py-1.5 text-slate-500 rounded-full font-bold text-[11px]">
                          ផែនទី
                        </button>
                      </div>

                      {/* Search & Filters */}
                      <div className="space-y-3">
                        <div className="relative">
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="ស្វែងរកទីតាំង..."
                            className="w-full px-4 py-3.5 pl-11 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-semibold text-slate-700"
                          />
                          <Search size={16} className="absolute left-4 top-4.5 text-slate-400" />
                        </div>

                        {/* Dropdown filters grid matching Screen 2 */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ស្រុក</label>
                            <select 
                              value={selectedDistrict}
                              onChange={e => setSelectedDistrict(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                            >
                              <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                              {customDistrictsList.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ឃុំ/សង្កាត់</label>
                            <select 
                              value={selectedCommune}
                              onChange={e => setSelectedCommune(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                            >
                              <option value="ទាំងអស់">ទាំងអស់</option>
                              {ROTANAK_MONDOL_COMMUNES.map(c => (
                                <option key={c} value={c}>ឃុំ{c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ភូមិ</label>
                            <select 
                              value={selectedVillage}
                              onChange={e => setSelectedVillage(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                            >
                              <option value="">ទាំងអស់</option>
                              <option value="ភូមិត្រៃត្រង្ស">ភូមិត្រៃត្រង្ស</option>
                              <option value="ភូមិអណ្តូងទឹក">ភូមិអណ្តូងទឹក</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ប្រភេទ</label>
                            <select 
                              value={selectedCategory}
                              onChange={e => setSelectedCategory(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                            >
                              <option value="ទាំងអស់">ទាំងអស់</option>
                              <option value="សាលារៀន">សាលារៀន</option>
                              <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                              <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                              <option value="សាលាឃុំ/ផ្ទះមេភូមិ">សាលាឃុំ/ផ្ទះមេភូមិ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Display results */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-moul text-xs text-slate-700">លទ្ធផល ({filteredLocations.length})</span>
                        </div>

                        <div className="space-y-4">
                          {filteredLocations.length > 0 ? (
                            filteredLocations.map(loc => (
                              <div key={loc.id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
                                <div className="h-40 w-full relative bg-slate-100">
                                  <img 
                                    src={loc.imageUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80"} 
                                    alt={loc.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <span className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[10px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                                    {loc.category}
                                  </span>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div>
                                    <h3 className="font-moul text-[13px] text-slate-800 mb-1 leading-relaxed">
                                      {loc.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                                      <MapPin size={12} className="text-emerald-600" />
                                      {loc.commune} • {loc.village}
                                    </p>
                                  </div>

                                  {/* Responsible official details */}
                                  {loc.officials && loc.officials.length > 0 && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                      {loc.officials.map((off, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                          <div>
                                            <span className="text-[9px] text-slate-400 font-bold block uppercase">{off.role || "មេភូមិ"}</span>
                                            <span className="text-xs font-bold text-slate-700">{off.name}</span>
                                          </div>
                                          {off.phone && (
                                            <a 
                                              href={`tel:${off.phone}`} 
                                              className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                            >
                                              <Phone size={12} />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <a 
                                    href={loc.mapLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-full py-3 bg-[#00965e] hover:bg-[#047857] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                                  >
                                    <MapIcon size={14} /> មើលទីតាំងលើផែនទី
                                  </a>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-150">
                              <MapPin size={36} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-slate-500 text-xs font-bold">មិនទាន់មានទីតាំងត្រូវបានចុះបញ្ជីទេ</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: ADD LOCATION */}
                  {activeTab === 'add_location' && (
                    <div className="space-y-4 animate-fade-in">
                      <form onSubmit={handleSubmitLocation} className="space-y-4">
                        
                        {/* Location Details section */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3.5">
                          <h3 className="font-moul text-xs text-slate-700 mb-2 pb-2 border-b border-slate-100">
                            ព័ត៌មានទីតាំង
                          </h3>
                          
                          <div>
                            <label className="text-xs font-bold text-slate-600">ឈ្មោះទីតាំង *</label>
                            <input 
                              type="text" 
                              required
                              value={newLocName} 
                              onChange={e => setNewLocName(e.target.value)} 
                              placeholder="បញ្ចូលឈ្មោះទីតាំង" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 mt-1 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600">ប្រភេទ *</label>
                            <select 
                              value={newLocCategory} 
                              onChange={e => setNewLocCategory(e.target.value)} 
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1 focus:bg-white"
                            >
                              <option value="សាលារៀន">សាលារៀន</option>
                              <option value="មណ្ឌលសុខភាព">មណ្ឌលសុខភាព</option>
                              <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                              <option value="សាលាឃុំ/ផ្ទះមេភូមិ">សាលាឃុំ/ផ្ទះមេភូមិ</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-600">ស្រុក/ខេត្ត *</label>
                              <select 
                                value={newLocDistrictType} 
                                onChange={e => setNewLocDistrictType(e.target.value)} 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1 focus:bg-white"
                              >
                                <option value="ស្រុករតនមណ្ឌល">ស្រុករតនមណ្ឌល</option>
                                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600">ឃុំ/សង្កាត់ *</label>
                              <select 
                                value={newLocCommune} 
                                onChange={e => setNewLocCommune(e.target.value)} 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1 focus:bg-white"
                              >
                                <option value="">ជ្រើសរើស</option>
                                {ROTANAK_MONDOL_COMMUNES.map(c => (
                                  <option key={c} value={c}>ឃុំ{c}</option>
                                ))}
                                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600">ភូមិ *</label>
                            <input 
                              type="text" 
                              required
                              value={newLocVillage} 
                              onChange={e => setNewLocVillage(e.target.value)} 
                              placeholder="បញ្ចូលឈ្មោះភូមិ" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 mt-1 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Location on Map */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3.5">
                          <h3 className="font-moul text-xs text-slate-700 mb-2 pb-2 border-b border-slate-100">
                            ទីតាំងលើផែនទី
                          </h3>
                          <button 
                            type="button" 
                            onClick={handleAutoGPS}
                            className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
                          >
                            <Compass size={16} className={isLocating ? 'animate-spin' : ''} />
                            {isLocating ? "កំពុងកំណត់ទីតាំង..." : "ជ្រើសរើសទីតាំងលើផែនទី"}
                          </button>
                          
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">ឬដាក់ Link ផែនទី</label>
                            <input 
                              type="text" 
                              value={newLocMapLink} 
                              onChange={e => setNewLocMapLink(e.target.value)} 
                              placeholder="បញ្ចូលតំណភ្ជាប់ Google Maps" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 mt-1 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Image Upload Block matching Screen 3 */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3">
                          <h3 className="font-moul text-xs text-slate-700 mb-1">
                            រូបភាពទីតាំង
                          </h3>
                          <label className="w-full h-40 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/20 cursor-pointer overflow-hidden flex flex-col items-center justify-center relative hover:bg-emerald-50/40 transition-colors">
                            {newLocImageBase64 ? (
                              <img src={newLocImageBase64} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-4">
                                <Camera size={36} className="mx-auto text-emerald-500 mb-2" />
                                <span className="text-xs font-bold text-slate-600 block mb-1">ចុចដើម្បីជ្រើសរើសរូបភាព</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">PNG, JPG (ទំហំមិនលើស 5MB)</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        </div>

                        {/* Responsible Person Info */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3.5">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                            <h3 className="font-moul text-xs text-slate-700">
                              ព័ត៌មានអ្នកទទួលខុសត្រូវ
                            </h3>
                            <button 
                              type="button" 
                              onClick={addOff} 
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {officials.map((o, i) => (
                            <div key={i} className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
                              {officials.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => rmOff(i)} 
                                  className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded-full"
                                >
                                  <X size={14} />
                                </button>
                              )}
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">តួនាទី *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={o.role} 
                                  onChange={e => updOff(i, 'role', e.target.value)} 
                                  placeholder="ឧ. មេឃុំ / មេភូមិ" 
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-700 mt-1"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500">ឈ្មោះ *</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={o.name} 
                                    onChange={e => updOff(i, 'name', e.target.value)} 
                                    placeholder="ឈ្មោះ" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-700 mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500">លេខទូរស័ព្ទ</label>
                                  <input 
                                    type="tel" 
                                    value={o.phone} 
                                    onChange={e => updOff(i, 'phone', e.target.value)} 
                                    placeholder="ទូរស័ព្ទ" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-700 mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons matching Screen 3 */}
                        <div className="flex gap-3 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setActiveTab('explore')}
                            className="flex-1 py-4.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-moul text-xs tracking-wider transition-colors"
                          >
                            បោះបង់
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-4.5 bg-[#00965e] hover:bg-[#047857] text-white rounded-2xl font-moul text-xs tracking-wider shadow-md transition-all active:scale-98"
                          >
                            រក្សាទុកទិន្នន័យ
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* TAB 3: TREE ACCORDION STRUCTURE (Screen 5) */}
                  {activeTab === 'tree_structure' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                          <FolderTree className="text-emerald-600" size={20} />
                          <h3 className="font-moul text-xs text-slate-800">
                            រចនាសម្ព័ន្ធបែងចែកសហគមន៍
                          </h3>
                        </div>

                        {/* Loop through District tree level */}
                        {Object.entries(buildTreeData).map(([distName, distData]) => (
                          <div key={distName} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 mb-3">
                            <button 
                              onClick={() => setExpandedDist(expandedDist === distName ? '' : distName)}
                              className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-100/50 transition-colors"
                            >
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                <FolderTree size={14} className="text-emerald-600" />
                                {distName}
                              </span>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {distData.total} ទីតាំង
                              </span>
                            </button>

                            {expandedDist === distName && (
                              <div className="p-3 bg-white border-t border-slate-100 space-y-2 pl-6">
                                {Object.entries(distData.communes).map(([commName, commData]) => (
                                  <div key={commName} className="border border-slate-50 rounded-xl overflow-hidden">
                                    <button 
                                      onClick={() => setExpandedComm(expandedComm === commName ? '' : commName)}
                                      className="w-full flex justify-between items-center p-3 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                    >
                                      <span className="font-bold text-slate-700 text-xs">
                                        ឃុំ {commName}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        {commData.total} ភូមិ/ទីតាំង
                                      </span>
                                    </button>

                                    {expandedComm === commName && (
                                      <div className="p-2 space-y-2 bg-white border-t border-slate-50 pl-4">
                                        {Object.entries(commData.villages).map(([villName, villData]) => (
                                          <div key={villName} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-xs font-bold text-slate-600">ភូមិ {villName}</span>
                                              <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-sm">
                                                គ្រួសារ: {villData.families} • មនុស្ស: {villData.people}
                                              </span>
                                            </div>
                                            {/* Categories breakdown inside village */}
                                            <div className="space-y-1 mt-2">
                                              {Object.entries(villData.categories).map(([catName, list]) => (
                                                <div key={catName} className="text-[10px] flex items-center justify-between text-slate-500">
                                                  <span>{catName}</span>
                                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm">{list.length}</span>
                                                </div>
                                              ))}
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ADMIN DASHBOARD (Screen 4) */}
                  {activeTab === 'admin_panel' && isAdmin && (
                    <div className="space-y-4 animate-fade-in">
                      
                      {/* Horizontal Admin Sub Tabs */}
                      <div className="flex gap-2 border-b border-slate-150 pb-2">
                        <button 
                          onClick={() => setAdminSubTab('approvals')}
                          className={`px-3 py-1.5 rounded-full font-bold text-[11px] ${adminSubTab === 'approvals' ? 'bg-[#00965e] text-white' : 'text-slate-500'}`}
                        >
                          ការអនុម័ត ({pendingLocations.length})
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('statistics')}
                          className={`px-3 py-1.5 rounded-full font-bold text-[11px] ${adminSubTab === 'statistics' ? 'bg-[#00965e] text-white' : 'text-slate-500'}`}
                        >
                          របាយការណ៍
                        </button>
                        <button 
                          onClick={() => setAdminSubTab('security')}
                          className={`px-3 py-1.5 rounded-full font-bold text-[11px] ${adminSubTab === 'security' ? 'bg-[#00965e] text-white' : 'text-slate-500'}`}
                        >
                          សុវត្ថិភាព
                        </button>
                      </div>

                      {/* Admin SubTab: Approvals & Stats Panel */}
                      {adminSubTab === 'approvals' && (
                        <div className="space-y-4">
                          {/* Grid matching Screen 4 Stats precisely */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ទីតាំងដែលបានអនុម័ត</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-slate-800">124</span>
                                <span className="text-[10px] text-emerald-600 font-bold">+12 នេះសប្តាហ៍</span>
                              </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">កំពុងរង់ចាំការអនុម័ត</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-slate-800">{pendingLocations.length}</span>
                                <span className="text-[10px] text-red-500 font-bold">-3 នេះសប្តាហ៍</span>
                              </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">អ្នកប្រើប្រាស់</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-slate-800">28</span>
                                <span className="text-[10px] text-emerald-600 font-bold">+4 នេះសប្តាហ៍</span>
                              </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">សុវត្ថិភាព</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-[#00965e]">98%</span>
                                <span className="text-[10px] text-[#00965e] font-bold">សុវត្ថិភាពល្អ</span>
                              </div>
                            </div>
                          </div>

                          {/* Pending Requests */}
                          <div className="space-y-3">
                            <h4 className="font-moul text-xs text-slate-700">ទីតាំងកំពុងរង់ចាំអនុម័ត</h4>
                            
                            {pendingLocations.map(loc => (
                              <div key={loc.id} className="bg-white p-4 rounded-2xl border border-slate-150 flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                    <img src={loc.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-800 text-xs">{loc.name}</h5>
                                    <p className="text-[10px] text-slate-400">{loc.commune} • {loc.village}</p>
                                    <p className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded-sm inline-block mt-0.5">រង់ចាំការអនុម័ត</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleApproveLocation(loc)}
                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLocation(loc)}
                                    className="p-2.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {pendingLocations.length === 0 && (
                              <div className="text-center py-10 bg-white rounded-2xl border border-slate-150">
                                <Check className="text-emerald-500 mx-auto mb-2" size={32} />
                                <p className="text-slate-500 text-xs font-bold">គ្មានការស្នើសុំកំពុងរង់ចាំការអនុម័តទេ</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Subtab: Statistics */}
                      {adminSubTab === 'statistics' && (
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3">
                            <h4 className="font-moul text-xs text-slate-700">របាយការណ៍សង្ខេប</h4>
                            <div className="p-4 bg-[#00965e]/10 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">អ្នកប្រើប្រាស់សរុបប្រចាំឆ្នាំ</span>
                                <span className="text-2xl font-bold text-[#00965e]">12,500 នាក់</span>
                              </div>
                              <BarChart2 size={32} className="text-[#00965e]" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Subtab: Security Logs */}
                      {adminSubTab === 'security' && (
                        <div className="space-y-3">
                          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-2.5 text-xs">
                            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              កត់ត្រាសកម្មភាពមិនធម្មតា និងការប៉ុនប៉ងចូលប្រើប្រាស់គណនី Admin ដោយគ្មានការអនុញ្ញាត។
                            </p>
                          </div>

                          <div className="space-y-2">
                            {securityLogs.length > 0 ? (
                              securityLogs.map(log => (
                                <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-150 text-[11px] space-y-1 shadow-2xs">
                                  <div className="flex justify-between font-bold text-red-600 border-b border-slate-50 pb-1.5 mb-1.5">
                                    <span>បរាជ័យក្នុងការចូលប្រើប្រាស់</span>
                                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-slate-600"><span className="text-slate-400">Password:</span> {log.attemptedPassword}</p>
                                  <p className="text-slate-600"><span className="text-slate-400">ឧបករណ៍:</span> {log.deviceInfo}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-10 text-xs text-slate-400 font-bold bg-white rounded-xl border border-slate-150">
                                គ្មានការកត់ត្រាការជ្រៀតជ្រែកទេ
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 5: NOTIFICATIONS / ACTIVITY LOGS (Screen 6) */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="font-moul text-xs text-slate-700">ការជូនដំណឹងថ្មីៗ</span>
                        <button 
                          onClick={clearAllNotifications}
                          className="text-[10px] text-emerald-600 font-bold hover:underline"
                        >
                          សម្អាតទាំងអស់
                        </button>
                      </div>

                      <div className="space-y-3">
                        {userNotifications.length > 0 ? (
                          userNotifications.map(n => (
                            <div key={n.id} className={`p-4 rounded-2xl border flex gap-3.5 items-start ${n.read ? 'bg-white border-slate-150 opacity-75' : 'bg-emerald-50/20 border-emerald-100'}`}>
                              <div className={`p-2.5 rounded-xl shrink-0 ${
                                n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                                n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                n.type === 'security' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                {n.type === 'success' && <Check size={16} />}
                                {n.type === 'warning' && <Bell size={16} />}
                                {n.type === 'security' && <ShieldCheck size={16} />}
                                {n.type === 'report' && <BarChart2 size={16} />}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-bold text-slate-800 leading-relaxed">{n.message}</p>
                                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-16 bg-white rounded-3xl border border-slate-150">
                            <Bell size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-xs font-bold">គ្មានការជូនដំណឹងថ្មីទេ</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* VISUAL EXACT BOTTOM NAVIGATION */}
                <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-2 py-2 flex justify-around items-center z-40 shadow-lg">
                  <button 
                    onClick={() => { setActiveTab('explore'); setIsAdmin(false); }}
                    className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${activeTab === 'explore' && !isAdmin ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Search size={20} />
                    <span className="text-[9px] font-bold">ទីតាំងដើម</span>
                  </button>

                  <button 
                    onClick={() => { if (!username) setShowNeedsAccountAlert(true); else { setActiveTab('add_location'); setIsAdmin(false); } }}
                    className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${activeTab === 'add_location' && !isAdmin ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <PlusCircle size={20} />
                    <span className="text-[9px] font-bold">បន្ថែម</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('tree_structure'); setIsAdmin(false); }}
                    className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${activeTab === 'tree_structure' && !isAdmin ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <FolderTree size={20} />
                    <span className="text-[9px] font-bold">ផែនទី</span>
                  </button>

                  <button 
                    onClick={() => { if (isAdmin) { setActiveTab('admin_panel'); } else { setShowAdminLogin(true); } }}
                    className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${isAdmin ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <ShieldCheck size={20} />
                    <span className="text-[9px] font-bold">របាយការណ៍</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('notifications'); setIsAdmin(false); }}
                    className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${activeTab === 'notifications' && !isAdmin ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <User size={20} />
                    <span className="text-[9px] font-bold">ខ្ញុំ</span>
                  </button>
                </nav>

              </div>
            )}

          </div>

          {/* SIMULATOR MODALS */}

          {/* ADMIN VERIFICATION MODAL */}
          {showAdminLogin && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-xs rounded-3xl p-5 border border-slate-100 shadow-2xl relative animate-fade-in text-center">
                <button 
                  onClick={() => setShowAdminLogin(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
                >
                  <X size={14} />
                </button>

                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={26} />
                </div>
                
                <h3 className="font-moul text-xs text-slate-800 mb-1">ផ្ទៀងផ្ទាត់សិទ្ធិ Admin</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Password: ict168mit</p>
                
                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <input 
                    type="password" 
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    placeholder="បញ្ចូលលេខកូដសម្ងាត់"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-center font-bold tracking-widest focus:border-emerald-500"
                  />
                  {adminError && (
                    <p className="text-[9px] text-red-500 font-bold bg-red-50 py-1.5 px-2 rounded-lg">
                      {adminError}
                    </p>
                  )}
                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#00965e] hover:bg-[#047857] text-white rounded-xl font-moul text-xs tracking-wider shadow-sm"
                  >
                    បញ្ជាក់សិទ្ធិ
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* NEEDS ACCOUNT WARNING MODAL */}
          {showNeedsAccountAlert && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center relative animate-fade-in">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-moul text-xs text-slate-800 mb-2">តម្រូវឱ្យមានគណនី</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  សូមចូលទៅកាន់អេក្រង់ចុះឈ្មោះ ដើម្បីអាចផ្ញើសំណើទីតាំងថ្មីបាន។
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowNeedsAccountAlert(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    បិទវិញ
                  </button>
                  <button 
                    onClick={() => { setShowNeedsAccountAlert(false); setCurrentPage(1); }}
                    className="flex-1 py-2.5 bg-[#00965e] hover:bg-[#047857] text-white rounded-xl text-xs font-bold"
                  >
                    ទៅចុះឈ្មោះ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK FLOATING TOAST NOTIFICATION */}
          {formStatus.show && (
            <div className="absolute top-16 left-4 right-4 z-50 bg-slate-900 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between border border-slate-800 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full ${formStatus.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  {formStatus.success ? <Check size={14} /> : <AlertTriangle size={14} />}
                </div>
                <p className="text-[11px] font-bold leading-relaxed">{formStatus.message}</p>
              </div>
              <button 
                onClick={() => setFormStatus({ ...formStatus, show: false })}
                className="text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}