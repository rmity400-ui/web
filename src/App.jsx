import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  MapPin, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  User, 
  Sun, 
  Moon, 
  ChevronRight, 
  Phone, 
  Map, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  LogOut,
  Globe
} from 'lucide-react';

// === CONFIGURATION & INITIALIZATION ===
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

// Secure Admin Password check (ict168mit)
const ADMIN_PASSWORD_HASH = "ict168mit"; 

export default function App() {
  // === STATE MANAGEMENT ===
  const [currentPage, setCurrentPage] = useState(1); // 1: Welcome, 2: Main Map App
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [userIdInput, setUserIdInput] = useState(''); // Secret ID for User Account
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Dropdown flag
  
  // Theme & Language state
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('kh'); // 'kh' or 'en'
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminError, setAdminError] = useState('');
  
  // Active Tab in Page 2
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'add_location', 'admin_panel'
  
  // Selection States for "Explore"
  const [selectedDistrict, setSelectedDistrict] = useState('rotanak_mondol'); // 'rotanak_mondol' or 'user_district'
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database States
  const [approvedLocations, setApprovedLocations] = useState([]);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [userList, setUserList] = useState([]);
  
  // New Location Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocDistrict, setNewLocDistrict] = useState('rotanak_mondol');
  const [newLocCommune, setNewLocCommune] = useState('');
  const [newLocVillage, setNewLocVillage] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('school');
  const [newLocLeader, setNewLocLeader] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocMapLink, setNewLocMapLink] = useState('');
  const [newLocImage, setNewLocImage] = useState('');
  const [formStatus, setFormStatus] = useState({ show: false, success: false, message: '' });

  // Static Fallback Data for Sdao Commune
  const defaultLocations = [
    {
      id: "default-1",
      name: "សាលាឃុំស្តៅ (Sdao Commune Hall)",
      district: "rotanak_mondol",
      commune: "sdao",
      village: "sdao",
      category: "chief_house",
      leader: "លោក ឃឹម មុនី (មេឃុំស្តៅ)",
      phone: "012 345 678",
      mapLink: "https://maps.google.com/?q=Sdao+Commune+Office+Rotanak+Mondol",
      imageUrl: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=600&q=80",
      approved: true,
      submittedBy: "VMC Team"
    },
    {
      id: "default-2",
      name: "សាលាបឋមសិក្សាស្តៅ (Sdao Primary School)",
      district: "rotanak_mondol",
      commune: "sdao",
      village: "sdao",
      category: "school",
      leader: "លោកគ្រូ នាយកសាលា",
      phone: "098 765 432",
      mapLink: "https://maps.google.com/?q=Sdao+Primary+School+Rotanak+Mondol",
      imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80",
      approved: true,
      submittedBy: "VMC Team"
    },
    {
      id: "default-3",
      name: "មណ្ឌលសុខភាពស្តៅ (Sdao Health Center)",
      district: "rotanak_mondol",
      commune: "sdao",
      village: "sdao",
      category: "hospital",
      leader: "ប្រធានមណ្ឌលសុខភាព",
      phone: "011 222 333",
      mapLink: "https://maps.google.com/?q=Sdao+Health+Center+Rotanak+Mondol",
      imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
      approved: true,
      submittedBy: "VMC Team"
    },
    {
      id: "default-4",
      name: "ប៉ុស្តិ៍នគរបាលរដ្ឋបាលឃុំស្តៅ (Sdao Commune Police Post)",
      district: "rotanak_mondol",
      commune: "sdao",
      village: "sdao",
      category: "police",
      leader: "លោក នាយប៉ុស្តិ៍ស្តៅ",
      phone: "015 999 888",
      mapLink: "https://maps.google.com/?q=Sdao+Police+Station+Rotanak+Mondol",
      imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
      approved: true,
      submittedBy: "VMC Team"
    },
    {
      id: "default-5",
      name: "ផ្ទះមេភូមិស្តៅ (Sdao Village Chief House)",
      district: "rotanak_mondol",
      commune: "sdao",
      village: "sdao",
      category: "chief_house",
      leader: "លោក មេភូមិស្តៅ",
      phone: "085 444 555",
      mapLink: "https://maps.google.com/?q=Sdao+Village+Rotanak+Mondol",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      approved: true,
      submittedBy: "VMC Team"
    }
  ];

  // Translations
  const t = {
    kh: {
      welcomeTitle: "សូមស្វាគមន៍មកកាន់ផែនទីសហគមន៍ឆ្លាតវៃ",
      welcomeSubtitle: "Smart Community Map",
      welcomeProject: "គម្រោង VMC ឆ្នាំ ២០២៦ វិទ្យាល័ស្តៅសន្តិភាព",
      projectIntro: "សេចក្តីណែនាំអំពីគម្រោង",
      projectDesc: "គម្រោង «ផែនទីសហគមន៍ឆ្លាតវៃ» នេះត្រូវបានបង្កើតឡើងក្នុងគោលបំណងជួយសម្រួលដល់ប្រជាពលរដ្ឋ និងអាជ្ញាធរមូលដ្ឋាន ក្នុងការស្វែងរកទីតាំងសំខាន់ៗដូចជា សាលាឃុំ មន្ទីរពេទ្យ សាលារៀន ប៉ុស្តិ៍នគរបាល និងផ្ទះមេភូមិ នៅក្នុងឃុំស្តៅ ស្រុករតនមណ្ឌល និងអាចពង្រីកទៅកាន់ស្រុកផ្សេងៗទៀតនាពេលអនាគត។ លើសពីនេះ ប្រព័ន្ធក៏អនុញ្ញាតឱ្យសមាជិកក្នុងសហគមន៍អាចចូលរួមចំណែកបន្ថែមទីតាំងថ្មីៗ ដោយឆ្លងកាត់ការត្រួតពិនិត្យ និងអនុម័តយ៉ាងត្រឹមត្រូវពីអ្នកគ្រប់គ្រង (Admin) ដើម្បីធានាបាននូវព័ត៌មានពិតប្រាកដ។",
      btnStart: "ដំណើរការចូលប្រើ",
      createdBy: "បង្កើតឡើងដោយយុវជនVMCវិទ្យាល័យស្តៅសន្តិភាព",
      searchPlaceholder: "ស្វែងរកទីតាំង មេភូមិ ឬលេខទូរស័ព្ទ...",
      districtSelect: "ជ្រើសរើសស្រុក",
      rotanakMondol: "ស្រុករតនមណ្ឌល",
      userDistrict: "ស្រុកអ្នកប្រើប្រាស់",
      communeSelect: "ជ្រើសរើសឃុំ",
      villageSelect: "ជ្រើសរើសភូមិ",
      categorySelect: "ប្រភេទទីតាំង",
      sdaoCommune: "ឃុំស្តៅ",
      andowkPratit: "ឃុំអណ្តើកហែប",
      phlongVillage: "ភូមិផ្លុង",
      sdaoVillage: "ភូមិស្តៅ",
      allCategories: "គ្រប់ប្រភេទទាំងអស់",
      school: "សាលារៀន",
      hospital: "មន្ទីរពេទ្យ / មណ្ឌលសុខភាព",
      police: "ប៉ុស្តិ៍ប៉ូលីស",
      chiefHouse: "ផ្ទះមេភូមិ / សាលាឃុំ",
      other: "ទីតាំងផ្សេងៗ",
      noData: "ទិន្នន័យកំពុងអភិវឌ្ឍ...",
      leaderName: "ឈ្មោះប្រធាន / មេឃុំ៖",
      phoneNumber: "លេខទូរស័ព្ទទំនាក់ទំនង៖",
      viewOnMap: "មើលទីតាំងលើ Google Map",
      addLocTitle: "ស្នើបន្ថែមទីតាំងថ្មី",
      addLocAlert: "រាល់ព័ត៌មានដែលអ្នកបញ្ចូលនឹងត្រូវឆ្លងកាត់ការអនុម័ត (Approve) ពី Admin ដើម្បីវិភាគថាជាព័ត៌មានពិត ឬព័ត៌មានក្លែងក្លាយ។",
      inputLocName: "ឈ្មោះទីតាំង (ឧ. សាលារៀន...)",
      inputLeader: "ឈ្មោះមេភូមិ / ប្រធានផ្នែក",
      inputPhone: "លេខទូរស័ព្ទទំនាក់ទំនង",
      inputMapLink: "តំណភ្ជាប់ Google Map (ប្រសិនបើមាន)",
      inputImage: "តំណភ្ជាប់រូបភាព (URL)",
      btnSubmitRequest: "ផ្ញើសំណើទៅកាន់ Admin",
      adminPortal: "កិច្ចការរដ្ឋបាល (Admin)",
      adminPassRequired: "សូមវាយបញ្ចូលលេខកូដសម្ងាត់ដើម្បីចូលទៅកាន់កិច្ចការរដ្ឋបាល៖",
      login: "ចូលប្រើប្រាស់",
      pendingApproval: "សំណើទីតាំងរង់ចាំការអនុម័ត",
      approve: "អនុម័ត (Approve)",
      delete: "លុបចោល",
      usersRegistered: "បញ្ជីឈ្មោះសមាជិកដែលបានចុះឈ្មោះ",
      enterUsername: "សូមបញ្ចូលឈ្មោះ និងលេខ ID របស់អ្នក",
      enterId: "លេខ ID សម្ងាត់ (Password)",
      save: "រក្សាទុក និងចូលប្រើ",
      darkMode: "របៀបងងឹត (Dark Mode)",
      language: "ភាសា (Language)",
      successUpload: "សំណើការដាក់ទីតាំងរបស់អ្នកទទួលបានជោគជ័យ! សូមរង់ចាំការពិនិត្យពី Admin។",
      emptyFields: "សូមបំពេញព័ត៌មានសំខាន់ៗឱ្យបានគ្រប់គ្រាន់!",
      logout: "ចាកចេញ",
      currentMember: "សមាជិកបច្ចុប្បន្ន៖"
    },
    en: {
      welcomeTitle: "Welcome to Smart Community Map",
      welcomeSubtitle: "Smart Community Map",
      welcomeProject: "VMC Project 2026 - Sdao Santepheap High School",
      projectIntro: "Project Introduction",
      projectDesc: "The 'Smart Community Map' project is designed to help local residents and authorities locate essential public services such as commune halls, hospitals, schools, police posts, and village chief houses in Sdao Commune, Rotanak Mondol District. Additionally, community members can contribute by suggesting new locations, which undergo a rigorous verification and approval process by Administrators (Admin) to ensure accurate and reliable data.",
      btnStart: "Get Started",
      createdBy: "Created by VMC Youth of Sdao Santepheap High School",
      searchPlaceholder: "Search locations, leaders, or phone...",
      districtSelect: "Select District",
      rotanakMondol: "Rotanak Mondol District",
      userDistrict: "User District",
      communeSelect: "Select Commune",
      villageSelect: "Select Village",
      categorySelect: "Location Category",
      sdaoCommune: "Sdao Commune",
      andowkPratit: "Andowk Haep Commune",
      phlongVillage: "Phlong Village",
      sdaoVillage: "Sdao Village",
      allCategories: "All Categories",
      school: "School",
      hospital: "Hospital / Health Center",
      police: "Police Station",
      chiefHouse: "Village Chief / Commune Hall",
      other: "Other Locations",
      noData: "Under development / No data found...",
      leaderName: "Leader / Representative:",
      phoneNumber: "Contact Phone:",
      viewOnMap: "View on Google Map",
      addLocTitle: "Request New Location",
      addLocAlert: "All information you submit must pass Admin approval to verify authenticity and prevent misinformation.",
      inputLocName: "Location Name (e.g. Sdao School...)",
      inputLeader: "Leader / Village Chief Name",
      inputPhone: "Contact Phone Number",
      inputMapLink: "Google Map URL Link",
      inputImage: "Image Link URL",
      btnSubmitRequest: "Send Request to Admin",
      adminPortal: "Admin Administration",
      adminPassRequired: "Please enter the administrative password:",
      login: "Login",
      pendingApproval: "Pending Locations for Approval",
      approve: "Approve",
      delete: "Delete",
      usersRegistered: "Registered Community Members",
      enterUsername: "Enter your Username & ID to continue",
      enterId: "Secret ID (Password)",
      save: "Save & Login",
      darkMode: "Dark Mode",
      language: "Language",
      successUpload: "Your location request has been submitted successfully! Please wait for Admin approval.",
      emptyFields: "Please fill in all mandatory fields!",
      logout: "Logout",
      currentMember: "Current Member:"
    }
  };

  // === FIREBASE AUTHENTICATION ===
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
             console.warn("Custom token failed, falling back to anonymous auth:", tokenError);
             await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      }
    });

    return () => unsubscribe();
  }, []);

  // === AUTO LOGIN CHECK ===
  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUsername(parsed.username);
        setCurrentPage(2);
      } catch(e) {
        localStorage.removeItem('user_session');
      }
    }
  }, []);

  // === REALTIME FIRESTORE DATA ===
  useEffect(() => {
    if (!user) return;

    // Listen for Approved & Pending Locations (Public Data)
    const locCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'location');
    const unsubscribeLoc = onSnapshot(
      locCollectionRef,
      (snapshot) => {
        const locs = [];
        snapshot.forEach((doc) => {
          locs.push({ id: doc.id, ...doc.data() });
        });
        
        const approved = locs.filter(l => l.approved === true);
        const pending = locs.filter(l => l.approved === false);
        
        setApprovedLocations(approved);
        setPendingLocations(pending);
      },
      (error) => {
        console.error("Error listening to locations:", error);
      }
    );

    // Listen for Users list
    const usersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'ramit');
    const unsubscribeUsers = onSnapshot(
      usersCollectionRef,
      (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
        setUserList(users);
      },
      (error) => {
        console.error("Error listening to users:", error);
      }
    );

    return () => {
      unsubscribeLoc();
      unsubscribeUsers();
    };
  }, [user]);

  // === HELPER ACTIONS ===
  const handleSaveUsername = async () => {
    if (!usernameInput.trim() || !userIdInput.trim()) return;
    const cleanUsername = usernameInput.trim();
    const cleanId = userIdInput.trim();
    
    setUsername(cleanUsername);
    localStorage.setItem('user_session', JSON.stringify({ username: cleanUsername, id: cleanId }));
    
    setIsUsernameModalOpen(false);
    setCurrentPage(2);

    if (user) {
      try {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'ramit', cleanId);
        await setDoc(userDocRef, {
          username: cleanUsername,
          userCustomId: cleanId,
          uid: user.uid,
          registeredAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Error saving user:", e);
      }
    }
  };

  const handleUserLogout = () => {
    localStorage.removeItem('user_session');
    setUsername('');
    setUsernameInput('');
    setUserIdInput('');
    setCurrentPage(1);
    setShowProfileMenu(false);
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    if (!newLocName || !newLocCommune || !newLocVillage || !newLocLeader || !newLocPhone) {
      setFormStatus({
        show: true,
        success: false,
        message: t[language].emptyFields
      });
      return;
    }

    try {
      const locCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'location');
      await addDoc(locCollectionRef, {
        name: newLocName,
        district: newLocDistrict,
        commune: newLocCommune,
        village: newLocVillage,
        category: newLocCategory,
        leader: newLocLeader,
        phone: newLocPhone,
        mapLink: newLocMapLink || `https://maps.google.com/?q=${newLocName}`,
        imageUrl: newLocImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        approved: false,
        submittedBy: username || "Anonymous User",
        submittedAt: new Date().toISOString()
      });

      setFormStatus({
        show: true,
        success: true,
        message: t[language].successUpload
      });

      setNewLocName('');
      setNewLocLeader('');
      setNewLocPhone('');
      setNewLocMapLink('');
      setNewLocImage('');
    } catch (error) {
      console.error("Error submitting location:", error);
      setFormStatus({
        show: true,
        success: false,
        message: "Error submitting location. Please try again."
      });
    }
  };

  const handleApproveLocation = async (locId) => {
    try {
      const locDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'location', locId);
      await updateDoc(locDocRef, { approved: true });
    } catch (e) {
      console.error("Error approving location:", e);
    }
  };

  const handleDeleteLocation = async (locId) => {
    try {
      const locDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'location', locId);
      await deleteDoc(locDocRef);
    } catch (e) {
      console.error("Error deleting location:", e);
    }
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD_HASH) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setActiveTab('admin_panel');
      setAdminError('');
    } else {
      setAdminError(language === 'kh' ? 'លេខកូដខុស! សូមព្យាយាមម្តងទៀត' : 'Incorrect Password! Try again.');
    }
  };

  const allAvailableLocations = [...defaultLocations, ...approvedLocations];

  const filteredLocations = allAvailableLocations.filter(loc => {
    if (loc.district !== selectedDistrict) return false;
    if (selectedCommune && loc.commune !== selectedCommune) return false;
    if (selectedVillage && loc.village !== selectedVillage) return false;
    if (selectedCategory && loc.category !== selectedCategory) return false;
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(queryLower) ||
        loc.leader.toLowerCase().includes(queryLower) ||
        loc.phone.toLowerCase().includes(queryLower)
      );
    }
    return true;
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'} font-sans flex flex-col transition-colors duration-200`}>
      
      {/* ================= PAGE 1: WELCOME SCREEN ================= */}
      {currentPage === 1 && (
        <div 
          className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 md:p-12 relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80')"
          }}
        >
          {/* Welcome Intro Section */}
          <div className="w-full md:w-1/2 flex flex-col items-start text-left text-white p-6 md:p-8 z-10">
            <div className="bg-emerald-600/35 border border-emerald-500 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {t[language].welcomeProject}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              {t[language].welcomeTitle}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light mb-6">
              ({t[language].welcomeSubtitle})
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setLanguage('kh')} 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${language === 'kh' ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
              >
                ភាសាខ្មែរ
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${language === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
              >
                English
              </button>
            </div>
          </div>

          {/* Project Box & Action Section */}
          <div className="w-full md:w-5/12 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 md:p-8 text-white shadow-2xl z-10 mt-6 md:mt-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <Info size={24} />
                <h2 className="text-xl font-bold tracking-wide">{t[language].projectIntro}</h2>
              </div>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 text-justify">
                {t[language].projectDesc}
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  const session = localStorage.getItem('user_session');
                  if (session) {
                    setCurrentPage(2);
                  } else {
                    setIsUsernameModalOpen(true);
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
              >
                {t[language].btnStart}
                <ChevronRight size={20} />
              </button>
              
              <div className="text-center text-xs text-slate-400">
                {t[language].createdBy}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE 2: MAIN WEB APP ================= */}
      {currentPage === 2 && (
        <div className="flex-1 flex flex-col animate-fadeIn">
          
          {/* Header Navigation Bar */}
          <header className={`sticky top-0 z-40 border-b transition-colors ${darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur px-4 py-3.5 flex items-center justify-between shadow-sm`}>
            
            {/* Branding */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentPage(1)}>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-md">
                <MapPin size={22} className="animate-bounce" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm md:text-base tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                  {t[language].welcomeSubtitle}
                </h1>
                <span className="text-[10px] block text-slate-400 font-medium">VMC Project 2026</span>
              </div>
            </div>

            {/* Controls & User profiles */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button 
                onClick={() => setLanguage(language === 'kh' ? 'en' : 'kh')}
                className={`p-2 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'} transition-all flex items-center gap-1.5`}
                title="Change Language"
              >
                <Globe size={16} />
                <span className="text-xs uppercase font-bold">{language === 'kh' ? 'EN' : 'KH'}</span>
              </button>

              {/* Dark mode toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-all`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Admin Portal Toggle */}
              <button 
                onClick={() => {
                  if (isAdmin) {
                    setActiveTab('admin_panel');
                  } else {
                    setShowAdminLogin(true);
                  }
                }}
                className={`p-2 rounded-xl border ${isAdmin ? 'bg-purple-600 text-white border-purple-500' : (darkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 hover:bg-slate-200')} transition-all flex items-center gap-1.5`}
                title="Admin Portal"
              >
                <ShieldCheck size={18} />
                {isAdmin && <span className="text-xs font-bold hidden md:inline">Admin</span>}
              </button>

              {/* Username Profile Tag with Dropdown */}
              <div className="relative">
                <div 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer hover:opacity-90 transition-all ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {username ? username.substring(0, 2) : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[10px] text-slate-400 leading-none">{t[language].currentMember}</p>
                    <p className="text-xs font-bold">{username || 'Guest'}</p>
                  </div>
                </div>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl overflow-hidden z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold truncate">{username}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{language === 'kh' ? 'សមាជិកសហគមន៍' : 'Community Member'}</p>
                    </div>
                    <button
                      onClick={handleUserLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      {language === 'kh' ? 'ចាកចេញពីគណនី' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Quick Tab Selector */}
          <div className={`flex border-b text-sm transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button 
              onClick={() => setActiveTab('explore')} 
              className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'explore' ? 'border-b-2 border-emerald-500 text-emerald-500 bg-white/5' : 'text-slate-500'}`}
            >
              <Search size={16} />
              <span>{language === 'kh' ? 'ស្វែងរកទីតាំង' : 'Explore'}</span>
            </button>
            <button 
              onClick={() => setActiveTab('add_location')} 
              className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'add_location' ? 'border-b-2 border-emerald-500 text-emerald-500 bg-white/5' : 'text-slate-500'}`}
            >
              <PlusCircle size={16} />
              <span>{language === 'kh' ? 'បញ្ចូលទីតាំងថ្មី' : 'Add Location'}</span>
            </button>
          </div>

          {/* Content Area */}
          <main className="flex-1 p-4 max-w-4xl mx-auto w-full">

            {/* TAB 1: EXPLORE MAPS */}
            {activeTab === 'explore' && (
              <div className="space-y-6">
                
                {/* Dual District Switch Header */}
                <div className="grid grid-cols-2 gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setSelectedDistrict('rotanak_mondol');
                      setSelectedCommune('');
                      setSelectedVillage('');
                    }}
                    className={`py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${selectedDistrict === 'rotanak_mondol' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {t[language].rotanakMondol}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDistrict('user_district');
                      setSelectedCommune('');
                      setSelectedVillage('');
                    }}
                    className={`py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${selectedDistrict === 'user_district' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {t[language].userDistrict}
                  </button>
                </div>

                {/* Main Filter Section */}
                {selectedDistrict === 'rotanak_mondol' ? (
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-md space-y-4`}>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].communeSelect}</label>
                        <select
                          value={selectedCommune}
                          onChange={(e) => {
                            setSelectedCommune(e.target.value);
                            setSelectedVillage('');
                          }}
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="">{language === 'kh' ? '--- គ្រប់ឃុំទាំងអស់ ---' : '--- All Communes ---'}</option>
                          <option value="sdao">{t[language].sdaoCommune}</option>
                          <option value="andowk">{t[language].andowkPratit}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].villageSelect}</label>
                        <select
                          value={selectedVillage}
                          onChange={(e) => setSelectedVillage(e.target.value)}
                          disabled={!selectedCommune}
                          className={`w-full p-3 rounded-xl border disabled:opacity-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="">{language === 'kh' ? '--- គ្រប់ភូមិទាំងអស់ ---' : '--- All Villages ---'}</option>
                          {selectedCommune === 'sdao' && (
                            <>
                              <option value="sdao">{t[language].sdaoVillage}</option>
                              <option value="phlong">{t[language].phlongVillage}</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Category Filter & Search Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].categorySelect}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: '', name: t[language].allCategories },
                            { id: 'school', name: t[language].school },
                            { id: 'hospital', name: t[language].hospital },
                            { id: 'police', name: t[language].police },
                            { id: 'chief_house', name: t[language].chiefHouse }
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-emerald-600 text-white shadow' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{language === 'kh' ? 'ស្វែងរកបែបលម្អិត' : 'Detailed Search'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={t[language].searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full p-3 pl-10 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                          />
                          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* User District View */
                  <div className={`p-8 rounded-2xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-md`}>
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t[language].noData}</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                      {language === 'kh' 
                        ? 'រាល់ទិន្នន័យស្រុកផ្សេងៗ គឺតម្រូវឱ្យ Admin ឬ សមាជិក បញ្ចូលទិន្នន័យជាមុនសិន។ ក្រុមការងារយើងខ្ញុំទើបតែបញ្ចូលទិន្នន័យគំរូនៃ «ស្រុករតនមណ្ឌល» ប៉ុណ្ណោះ។'
                        : 'All data for other districts must be entered by Admin or Community members first. We have initially set up detailed data only for Rotanak Mondol.'
                      }
                    </p>
                    <button
                      onClick={() => setActiveTab('add_location')}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center gap-2 mx-auto"
                    >
                      <PlusCircle size={18} />
                      {language === 'kh' ? 'ចូលរួមបន្ថែមទីតាំងថ្មី' : 'Contribute and Add Location'}
                    </button>
                  </div>
                )}

                {/* EXPLORE RESULTS */}
                {selectedDistrict === 'rotanak_mondol' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-extrabold flex items-center gap-2">
                        <MapPin size={20} className="text-emerald-500" />
                        <span>{language === 'kh' ? `លទ្ធផលស្វែងរក (${filteredLocations.length})` : `Explore Results (${filteredLocations.length})`}</span>
                      </h2>
                    </div>

                    {filteredLocations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLocations.map((loc) => (
                          <div 
                            key={loc.id} 
                            className={`rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                          >
                            <div className="h-44 w-full relative bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <img 
                                src={loc.imageUrl} 
                                alt={loc.name}
                                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80";
                                }}
                              />
                              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-white font-bold uppercase tracking-wider">
                                {loc.category === 'school' && t[language].school}
                                {loc.category === 'hospital' && t[language].hospital}
                                {loc.category === 'police' && t[language].police}
                                {loc.category === 'chief_house' && t[language].chiefHouse}
                                {loc.category === 'other' && t[language].other}
                              </div>
                            </div>

                            <div className="p-5 space-y-4">
                              <div>
                                <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-1 text-emerald-500">{loc.name}</h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                  <span>{t[language].rotanakMondol}</span> &bull; 
                                  <span>{loc.commune === 'sdao' ? t[language].sdaoCommune : t[language].andowkPratit}</span> &bull;
                                  <span>{loc.village === 'sdao' ? t[language].sdaoVillage : t[language].phlongVillage}</span>
                                </p>
                              </div>

                              <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800/80 py-3 text-xs md:text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-400">{t[language].leaderName}</span>
                                  <span className="font-bold">{loc.leader}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-400">{t[language].phoneNumber}</span>
                                  <a href={`tel:${loc.phone}`} className="font-bold text-emerald-500 flex items-center gap-1 hover:underline">
                                    <Phone size={14} />
                                    {loc.phone}
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <a 
                                  href={loc.mapLink}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                >
                                  <Map size={15} />
                                  {t[language].viewOnMap}
                                </a>
                              </div>
                              {loc.submittedBy && loc.submittedBy !== "VMC Team" && (
                                <div className="text-[10px] text-right text-slate-400 italic">
                                  Submitted by: {loc.submittedBy}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        {language === 'kh' ? 'រកមិនឃើញទីតាំងដែលត្រូវគ្នានឹងការស្វែងរករបស់អ្នកឡើយ។' : 'No locations matching your search filters.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADD NEW LOCATION */}
            {activeTab === 'add_location' && (
              <div className="space-y-6">
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex gap-3">
                  <div className="text-amber-500 mt-1 shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 mb-0.5">{language === 'kh' ? 'ការជូនដំណឹងពីប្រព័ន្ធសុវត្ថិភាព' : 'System Notice'}</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                      {t[language].addLocAlert}
                    </p>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-md`}>
                  <h3 className="text-lg font-bold mb-4 text-emerald-500 flex items-center gap-2">
                    <PlusCircle size={20} />
                    {t[language].addLocTitle}
                  </h3>

                  <form onSubmit={handleSubmitLocation} className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].inputLocName} *</label>
                        <input
                          type="text"
                          required
                          value={newLocName}
                          onChange={(e) => setNewLocName(e.target.value)}
                          placeholder="ឧ. ផ្ទះមេភូមិ... សាលាបឋមសិក្សា..."
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].categorySelect} *</label>
                        <select
                          value={newLocCategory}
                          onChange={(e) => setNewLocCategory(e.target.value)}
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="school">{t[language].school}</option>
                          <option value="hospital">{t[language].hospital}</option>
                          <option value="police">{t[language].police}</option>
                          <option value="chief_house">{t[language].chiefHouse}</option>
                          <option value="other">{t[language].other}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].districtSelect} *</label>
                        <select
                          value={newLocDistrict}
                          onChange={(e) => setNewLocDistrict(e.target.value)}
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="rotanak_mondol">{t[language].rotanakMondol}</option>
                          <option value="user_district">{t[language].userDistrict}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].communeSelect} *</label>
                        <select
                          value={newLocCommune}
                          onChange={(e) => setNewLocCommune(e.target.value)}
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="">{language === 'kh' ? '-- ជ្រើសរើសឃុំ --' : '-- Choose --'}</option>
                          <option value="sdao">{t[language].sdaoCommune}</option>
                          <option value="andowk">{t[language].andowkPratit}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].villageSelect} *</label>
                        <select
                          value={newLocVillage}
                          onChange={(e) => setNewLocVillage(e.target.value)}
                          disabled={!newLocCommune}
                          className={`w-full p-3 rounded-xl border disabled:opacity-50 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="">{language === 'kh' ? '-- ជ្រើសរើសភូមិ --' : '-- Choose --'}</option>
                          {newLocCommune === 'sdao' && (
                            <>
                              <option value="sdao">{t[language].sdaoVillage}</option>
                              <option value="phlong">{t[language].phlongVillage}</option>
                            </>
                          )}
                          {newLocCommune === 'andowk' && (
                            <option value="andowk">ភូមិអណ្តើកហែប</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].inputLeader} *</label>
                        <input
                          type="text"
                          required
                          value={newLocLeader}
                          onChange={(e) => setNewLocLeader(e.target.value)}
                          placeholder="ឧ. លោក សុខ សារី (មេភូមិ)"
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].inputPhone} *</label>
                        <input
                          type="text"
                          required
                          value={newLocPhone}
                          onChange={(e) => setNewLocPhone(e.target.value)}
                          placeholder="ឧ. 012 XXX XXX"
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].inputMapLink}</label>
                        <input
                          type="url"
                          value={newLocMapLink}
                          onChange={(e) => setNewLocMapLink(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].inputImage}</label>
                        <input
                          type="url"
                          value={newLocImage}
                          onChange={(e) => setNewLocImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={18} />
                      {t[language].btnSubmitRequest}
                    </button>

                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: ADMIN PANEL */}
            {activeTab === 'admin_panel' && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-purple-500 flex items-center gap-2">
                      <ShieldCheck size={24} />
                      {t[language].adminPortal}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'kh' ? 'គ្រប់គ្រង និងពិនិត្យទិន្នន័យពីប្រព័ន្ធ Firebase' : 'Review submitted locations and system analytics'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAdmin(false);
                      setActiveTab('explore');
                    }}
                    className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut size={14} />
                    {t[language].logout}
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>{t[language].pendingApproval}</span>
                    <span className="px-2 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-bold">
                      {pendingLocations.length}
                    </span>
                  </h3>

                  {pendingLocations.length > 0 ? (
                    <div className="space-y-4">
                      {pendingLocations.map((loc) => (
                        <div 
                          key={loc.id} 
                          className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                        >
                          <div className="flex gap-4 items-start">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                              <img 
                                src={loc.imageUrl} 
                                alt={loc.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80";
                                }}
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-purple-400">{loc.name}</h4>
                              <p className="text-xs text-slate-400">
                                {t[language].rotanakMondol} &bull; {loc.commune === 'sdao' ? 'ឃុំស្តៅ' : 'ឃុំអណ្តើកហែប'} &bull; {loc.village === 'sdao' ? 'ភូមិស្តៅ' : 'ភូមិផ្លុង'}
                              </p>
                              <div className="mt-1.5 text-xs space-y-1">
                                <p><span className="text-slate-400">Leader:</span> <span className="font-semibold">{loc.leader}</span></p>
                                <p><span className="text-slate-400">Phone:</span> <span className="font-semibold text-emerald-500">{loc.phone}</span></p>
                                <p className="text-[10px] text-purple-400 italic">Submitted by: {loc.submittedBy || 'Anonymous'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex md:flex-col lg:flex-row gap-2 w-full md:w-auto">
                            <button
                              onClick={() => handleApproveLocation(loc.id)}
                              className="flex-1 md:flex-initial py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                            >
                              <Check size={14} />
                              {t[language].approve}
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="flex-1 md:flex-initial py-2 px-4 bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/25 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <X size={14} />
                              {t[language].delete}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm italic">
                      {language === 'kh' ? 'មិនមានសំណើទីតាំងថ្មីកំពុងរង់ចាំឡើយ។' : 'No pending location requests.'}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>{t[language].usersRegistered}</span>
                    <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
                      {userList.length}
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {userList.map((usr) => (
                      <div 
                        key={usr.id} 
                        className={`p-3 rounded-xl border flex items-center gap-2.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold uppercase">
                          {usr.username ? usr.username.substring(0, 2) : 'US'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs truncate">{usr.username || 'Anonymous'}</p>
                          <p className="text-[10px] text-slate-500">ID: {usr.userCustomId || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </main>

          {/* Footer Branding Area */}
          <footer className={`py-4 mt-auto border-t text-center text-xs font-bold transition-colors ${darkMode ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
            &copy; 2026 {t[language].createdBy}
          </footer>

        </div>
      )}

      {/* ================= MODAL: USERNAME SETUP ================= */}
      {isUsernameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800 shadow-2xl relative text-slate-800 dark:text-white">
            
            <button 
              onClick={() => setIsUsernameModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <User className="text-emerald-500" size={20} />
              {language === 'kh' ? 'ចូលប្រើប្រាស់ ឬ បង្កើតគណនី' : 'Login / Register'}
            </h3>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {language === 'kh' 
                ? 'សូមបញ្ចូលឈ្មោះ និងលេខ ID សម្ងាត់របស់អ្នក ដើម្បីចូលប្រើមុខងារស្វែងរក និងបញ្ចូលទីតាំងក្នុងប្រព័ន្ធ។'
                : 'Please enter your username and secret ID to access search and location features.'
              }
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{language === 'kh' ? 'ឈ្មោះសមាជិក' : 'Username'}</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="ឧ. ramit"
                  maxLength={20}
                  className="w-full p-3 rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{t[language].enterId}</label>
                <input
                  type="password"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="••••••••"
                  maxLength={20}
                  className="w-full p-3 rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveUsername}
                  disabled={!usernameInput.trim() || !userIdInput.trim()}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow"
                >
                  {t[language].save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIN PASSWORD LOGIN ================= */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800 shadow-2xl relative text-slate-800 dark:text-white">
            
            <button 
              onClick={() => {
                setShowAdminLogin(false);
                setAdminError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold mb-3 text-purple-500 flex items-center gap-2">
              <ShieldCheck size={22} />
              {language === 'kh' ? 'ការផ្ទៀងផ្ទាត់ Admin' : 'Admin Authorization'}
            </h3>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t[language].adminPassRequired}
                </label>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {adminError && (
                <p className="text-xs text-red-500 font-semibold">{adminError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow"
              >
                {t[language].login}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= POPUP ALERTS ================= */}
      {formStatus.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl flex gap-3 animate-slideIn">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${formStatus.success ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
            {formStatus.success ? <Check size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {formStatus.success ? 'Success' : 'Notification'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {formStatus.message}
            </p>
            <button 
              onClick={() => setFormStatus({ ...formStatus, show: false })}
              className="mt-2 text-[10px] text-emerald-500 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}