import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, MapPin, Navigation, Building2, Store, GraduationCap, 
  ShieldAlert, Lock, User, Phone, Trash2, Activity, BarChart3, 
  Settings, AlertTriangle, X, Crosshair, Layers, 
  Loader2, Moon, Sun, Globe, PhoneCall, Save, CheckCircle
} from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

let app, auth, db, appId, firebaseConfig;
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E", 
    authDomain: "ramit-7e364.firebaseapp.com",
    projectId: "ramit-7e364",
    storageBucket: "ramit-7e364.firebasestorage.app",
    messagingSenderId: "1036691345731",
    appId: "1:1036691345731:web:df8121852c6137e3b35ff6"
  };
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  
  const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'smart-map-app-kh';
  appId = rawAppId.replace(/\//g, '_'); 
} catch (e) {
  console.error("Firebase init error:", e);
}

// Distance Calculator
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

// Fallback Function for Offline
const getFallbackPOIs = (lat, lng) => {
  return [
    {
      id: 'fallback-sisowath',
      displayName: { text: "វិទ្យាល័យព្រះស៊ីសុវត្ថិ" },
      formattedAddress: "ភ្នំពេញ, កម្ពុជា",
      location: { lat: lat + 0.005, lng: lng + 0.005 },
      types: ['school']
    },
    {
      id: 'fallback-calmette',
      displayName: { text: "មន្ទីរពេទ្យកាល់ម៉ែត" },
      formattedAddress: "ភ្នំពេញ, កម្ពុជា",
      location: { lat: lat - 0.005, lng: lng - 0.005 },
      types: ['hospital']
    }
  ];
};

// ==========================================
// TRANSLATION DICTIONARY (ខ្មែរ 🇰🇭 / English 🇺🇸)
// ==========================================
const dict = {
  km: {
    appTitle: "Smart Map",
    searchBox: "ស្វែងរកប្រទេស ខេត្ត ស្រុក ឃុំ ភូមិ ឬទីតាំង...",
    myLocation: "ត្រលប់មកទីតាំងខ្ញុំ",
    nearbyPlaces: "បញ្ជីទីតាំងជុំវិញអ្នក",
    noPlaces: "មិនមានទីតាំងសំខាន់ៗនៅក្បែរនេះទេ",
    callBtn: "ខលទាក់ទងឥឡូវនេះ",
    adminBtn: "ប្រព័ន្ធគ្រប់គ្រង",
    offlineMode: "របៀបគ្មានអ៊ីនធឺណិត (Offline Mode)",
    offlineNotice: "អ្នកកំពុងប្រើប្រាស់ក្រៅបណ្តាញ (Offline)។ ខាងក្រោមជាលេខទំនាក់ទំនងបន្ទាន់ដែលបានរក្សាទុក៖",
    noInternet: "គ្មានអ៊ីនធឺណិតទេ (បង្ហាញទិន្នន័យក្នុងម៉ាស៊ីន)",
    adminLogin: "ផ្ទៀងផ្ទាត់សិទ្ធិជា Admin",
    enterPass: "បញ្ចូលលេខសម្ងាត់អ្នកគ្រប់គ្រង...",
    loginBtn: "ចូលប្រើប្រាស់",
    cancelBtn: "បោះបង់",
    saveBtn: "រក្សាទុកទិន្នន័យ",
    placeNameLabel: "ឈ្មោះស្ថាប័ន ឬបុគ្គល",
    phoneLabel: "លេខទូរស័ព្ទទំនាក់ទំនង",
    typeLabel: "ប្រភេទស្ថាប័ន",
    locationAlert: "ទីតាំងនឹងត្រូវកំណត់យកកន្លែងដែលអ្នកកំពុងឈរផ្ទាល់ (GPS) ឬទីតាំងដែលអ្នកបានចង្អុលលើផែនទី។",
    gpsActive: "ឡាយ GPS ដំណើរការធម្មតា",
    gpsSearching: "កំពុងស្វែងរកទីតាំងរបស់អ្នក...",
    gpsError: "សូមបើក GPS លើទូរស័ព្ទរបស់អ្នក",
    gpsUnsupported: "ទូរស័ព្ទមិនគាំទ្រ GPS ឡើយ",
    totalUsers: "អ្នកប្រើសរុប",
    activeToday: "អ្នកប្រើថ្ងៃនេះ",
    addedPlaces: "ទីតាំងបានបញ្ចូលព័ត៌មាន",
    securityTitle: "កំណត់ត្រាសន្តិសុខ (Security Logs)",
    noSecurityIssues: "គ្មានបញ្ហាសន្តិសុខទេ 🛡️",
    timeLabel: "ម៉ោង/កាលបរិច្ឆេទ",
    ipLabel: "IP Address / ឧបករណ៍",
    wrongPassLabel: "Password ដែលវាយខុស",
    clearLogsBtn: "លុបកំណត់ហេតុទាំងអស់",
    localDataOnly: "NO ! មិនទាន់មានទិន្នន័យទំនាក់ទំនងផ្លូវការ",
    verifyTitle: "ផ្ទៀងផ្ទាត់សិទ្ធិជា Admin",
    verifyNotice: "សូមបញ្ចូលលេខសម្ងាត់គ្រប់គ្រង ដើម្បីទទួលបានសិទ្ធិបន្ថែមទីតាំង តួនាទី និងលេខទូរស័ព្ទផ្លូវការ។",
    logoutBtn: "ចាកចេញពីគណនី",
    adminTabLoc: "គ្រប់គ្រងទីតាំង",
    adminTabRep: "របាយការណ៍ និងស្ថិតិ",
    adminTabSec: "សន្តិសុខប្រព័ន្ធ",
    addLocTitle: "➕ បន្ថែមទីតាំងថ្មីលើផែនទី",
    placeHolderName: "ឧទាហរណ៍៖ សាលាបឋមសិក្សាវត្តភ្នំ",
    placeholderPhone: "ឧទាហរណ៍៖ 012 345 678",
    selectSchool: "សាលារៀន / នាយកសាលា",
    selectHospital: "មន្ទីរពេទ្យ / គ្លីនិក",
    selectPolice: "ប៉ុស្តិ៍ប៉ូលីស",
    selectCommune: "សាលាឃុំ / ផ្ទះមេភូមិ",
    recenterBtn: "ត្រលប់មកទីតាំងខ្ញុំវិញ",
    analyticTitle: "របាយការណ៍ និងស្ថិតិអ្នកប្រើប្រាស់",
    weekStat: "ស្ថិតិប្រចាំសប្តាហ៍",
    monthStat: "ស្ថិតិប្រចាំខែ",
    yearStat: "ស្ថិតិប្រចាំឆ្នាំ",
    activeRate: "អត្រាសកម្មភាព",
    userGrowth: "កំណើនអ្នកប្រើប្រាស់",
    toastSaveSuccess: "រក្សាទុកទិន្នន័យជោគជ័យ!",
    toastDeleteSuccess: "បានលុបទិន្នន័យជោគជ័យ",
    toastLoginSuccess: "ចូលជា Admin ជោគជ័យ!",
    toastLoginError: "លេខសម្ងាត់មិនត្រឹមត្រូវទេ!",
    notSetLabel: "NO ! លេខ និងតួនាទីមិនទាន់បញ្ជាក់",
    confirmClearTitle: "បញ្ជាក់ការលុប",
    confirmClearMsg: "តើអ្នកពិតជាចង់លុបកំណត់ហេតុសន្តិសុខទាំងអស់មែនទេ?",
    confirmYes: "យល់ព្រមលុប",
    confirmNo: "បោះបង់"
  },
  en: {
    appTitle: "Smart Map",
    searchBox: "Search countries, provinces, districts, villages...",
    myLocation: "Recenter Map",
    nearbyPlaces: "Nearby Locations Around You",
    noPlaces: "No important places found nearby",
    callBtn: "Call Now",
    adminBtn: "Admin System",
    offlineMode: "Offline Mode (Saved Contacts)",
    offlineNotice: "You are offline. Below are the saved emergency contacts:",
    noInternet: "No Internet Connection (Offline Mode)",
    adminLogin: "Verify Admin Access",
    enterPass: "Enter admin password...",
    loginBtn: "Login Access",
    cancelBtn: "Cancel",
    saveBtn: "Save Data",
    placeNameLabel: "Institution / Name",
    phoneLabel: "Contact Phone Number",
    typeLabel: "Institution Type",
    locationAlert: "The location will be set to your current GPS position or where you tapped on the map.",
    gpsActive: "Live GPS Active",
    gpsSearching: "Searching for your location...",
    gpsError: "Please enable your phone's GPS",
    gpsUnsupported: "Device does not support GPS",
    totalUsers: "Total Visitors",
    activeToday: "Active Today",
    addedPlaces: "Enriched Locations",
    securityTitle: "Security & System Logs",
    noSecurityIssues: "No security issues detected 🛡️",
    timeLabel: "Time & Date",
    ipLabel: "IP / Device",
    wrongPassLabel: "Attempted Wrong Password",
    clearLogsBtn: "Clear All Logs",
    localDataOnly: "No official contact data yet",
    verifyTitle: "Verify Admin Credentials",
    verifyNotice: "Enter your administrator password to add authenticated locations, roles, and phones.",
    logoutBtn: "Logout Admin",
    adminTabLoc: "Manage Locations",
    adminTabRep: "Analytics & Reports",
    adminTabSec: "System Security",
    addLocTitle: "➕ Add New Location",
    placeHolderName: "e.g., Wat Phnom Primary School",
    placeholderPhone: "e.g., 012 345 678",
    selectSchool: "School / Principal",
    selectHospital: "Hospital / Clinic",
    selectPolice: "Police Station",
    selectCommune: "Commune Hall / Village Head",
    recenterBtn: "Recenter on Me",
    analyticTitle: "User Reports & Traffic Statistics",
    weekStat: "Weekly Stats",
    monthStat: "Monthly Stats",
    yearStat: "Yearly Stats",
    activeRate: "Activity Rate",
    userGrowth: "User Growth Rate",
    toastSaveSuccess: "Data saved successfully!",
    toastDeleteSuccess: "Data deleted successfully",
    toastLoginSuccess: "Logged in as Admin successfully!",
    toastLoginError: "Incorrect password! Please try again",
    notSetLabel: "NO ! Contact & Role unassigned",
    confirmClearTitle: "Confirm Deletion",
    confirmClearMsg: "Are you sure you want to clear all security logs?",
    confirmYes: "Yes, clear them",
    confirmNo: "Cancel"
  }
};

// Deep Translation Function for Place Names & Custom Data
const translateTextToEn = (text) => {
    if (!text) return '';
    return text
        .replace(/មន្ទីរពេទ្យ/g, 'Hospital')
        .replace(/មណ្ឌលសុខភាព/g, 'Health Center')
        .replace(/គ្លីនិក/g, 'Clinic')
        .replace(/សាលាបឋមសិក្សា/g, 'Primary School')
        .replace(/អនុវិទ្យាល័យ/g, 'Secondary School')
        .replace(/វិទ្យាល័យ/g, 'High School')
        .replace(/សាកលវិទ្យាល័យ/g, 'University')
        .replace(/សាលារៀន/g, 'School')
        .replace(/នាយកសាលា/g, 'School Principal')
        .replace(/ប៉ុស្តិ៍នគរបាលរដ្ឋបាល/g, 'Commune Police')
        .replace(/ប៉ុស្តិ៍នគរបាល/g, 'Police Station')
        .replace(/ប៉ុស្តិ៍ប៉ូលីស/g, 'Police Post')
        .replace(/សាលាឃុំ/g, 'Commune Hall')
        .replace(/សាលាសង្កាត់/g, 'Sangkat Hall')
        .replace(/ផ្ទះមេភូមិ/g, 'Village Head House')
        .replace(/មេភូមិ/g, 'Village Head')
        .replace(/សង្កាត់/g, 'Sangkat')
        .replace(/ឃុំ/g, 'Commune')
        .replace(/ស្រុក/g, 'District')
        .replace(/ខណ្ឌ/g, 'Khan')
        .replace(/ខេត្ត/g, 'Province')
        .replace(/ភូមិ/g, 'Village');
};

const getPlaceTypeName = (types, currentLang) => {
  if (currentLang !== 'km' || !types) return '';
  if (types.includes('school') || types.includes('university') || types.includes('primary_school')) return ' (សាលារៀន)';
  if (types.includes('hospital') || types.includes('doctor') || types.includes('health') || types.includes('pharmacy')) return ' (មន្ទីរពេទ្យ/គ្លីនិក)';
  if (types.includes('police')) return ' (ប៉ុស្តិ៍ប៉ូលីស)';
  if (types.includes('local_government_office') || types.includes('city_hall')) return ' (សាលាឃុំ/សង្កាត់)';
  return '';
};

const getPlaceName = (place, lang) => {
  if (!place) return '';
  let name = '';
  if (place.displayName && typeof place.displayName === 'object') name = place.displayName.text || '';
  else name = place.displayName || place.name || '';
  
  if (lang === 'en') {
     name = translateTextToEn(name);
  }
  return name;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('user'); 
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  const isAdminRef = useRef(isAdminUser);
  useEffect(() => {
    isAdminRef.current = isAdminUser;
  }, [isAdminUser]);

  const [lang, setLang] = useState('km'); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const t = dict[lang];

  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('locations');
  
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [trackingError, setTrackingError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [enrichedData, setEnrichedData] = useState({});
  const [offlineContacts, setOfflineContacts] = useState([]); 
  const [securityLogs, setSecurityLogs] = useState([]);
  const [editingPlace, setEditingPlace] = useState(null);
  const [customInfo, setCustomInfo] = useState({ name: '', role: '', phone: '' });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [gpsStatus, setGpsStatus] = useState('');
  const [mapTheme, setMapTheme] = useState('roadmap'); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null, title: '' });
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const mapRef = useRef(null);          
  const mapElementRef = useRef(null);   
  const userMarkerRef = useRef(null);
  const markersRef = useRef([]);        
  const lastFetchedCenter = useRef(null); 
  const watchIdRef = useRef(null);
  const infoWindowRef = useRef(null);

  // NOTE: This API Key should ideally be restricted and provided via environment variables in production.
  const API_KEY = "AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg";
  const ADMIN_PASS = "ict168mit";

  // Global Toast function
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, [setToast]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth init warning", e); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !sessionStorage.getItem('hasLoggedVisit') && db) {
        try {
          const docId = Date.now().toString() + "-" + Math.floor(Math.random()*1000);
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visitor_stats', docId), { 
            uid: currentUser.uid, timestamp: Date.now(), userAgent: navigator.userAgent 
          }).catch(err => console.warn("Analytics setDoc blocked due to permission rules."));
          sessionStorage.setItem('hasLoggedVisit', 'true');
        } catch(e) {}
      }
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedContacts = localStorage.getItem('smartmap_offline_contacts');
    if (savedContacts) setOfflineContacts(JSON.parse(savedContacts));

    return () => { 
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    
    const ramitRef = collection(db, 'artifacts', appId, 'public', 'data', 'ramit');
    const unsubRamit = onSnapshot(ramitRef, (snapshot) => {
      const data = {};
      const contactsForOffline = [];
      snapshot.forEach(doc => { 
        data[doc.id] = doc.data(); 
        contactsForOffline.push(doc.data());
      });
      setEnrichedData(data);
      localStorage.setItem('smartmap_offline_contacts', JSON.stringify(contactsForOffline));
      setOfflineContacts(contactsForOffline);
    }, (error) => console.warn("Firestore snapshot loading issue", error));

    const securityRef = collection(db, 'artifacts', appId, 'public', 'data', 'security_logs');
    const unsubSecurity = onSnapshot(securityRef, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => { logs.push({ id: doc.id, ...doc.data() }); });
      setSecurityLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => console.warn("Error loading security logs", error));

    const visitorRef = collection(db, 'artifacts', appId, 'public', 'data', 'visitor_stats');
    const unsubVisitor = onSnapshot(visitorRef, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => { logs.push({ id: doc.id, ...doc.data() }); });
      setVisitorLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => console.warn("Error loading visitor logs", error));

    return () => { unsubRamit(); unsubSecurity(); unsubVisitor(); };
  }, [user]);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsApiLoaded(true);
      return;
    }

    // Handle Google Maps Authentication Error gracefully
    window.gm_authFailure = () => {
       showToast("Google Maps API Key មិនត្រឹមត្រូវ (InvalidKeyMapError)។", "error");
       setIsApiLoaded(false);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,marker&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsApiLoaded(true);
    script.onerror = () => {
       showToast("មិនអាចផ្ទុក Google Maps API បានទេ", "error");
       setIsApiLoaded(false);
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      delete window.gm_authFailure;
    };
  }, [API_KEY, showToast]);

  // UPDATE PLACES MARKERS
  const updateMarkers = useCallback((newPlaces) => {
    markersRef.current.forEach(marker => { if (marker) marker.map = null; });
    markersRef.current = [];

    newPlaces.forEach(place => {
      if (!place.location || !place.id) return;
      const isEnriched = enrichedData[place.id];
      
      const typeSuffix = getPlaceTypeName(place.types, lang);
      const displayTitle = getPlaceName(place, lang) + typeSuffix;

      const markerElement = document.createElement('div');
      markerElement.className = `p-2 rounded-full shadow-lg text-white flex items-center justify-center transition-all ${isEnriched ? 'bg-emerald-600 border-2 border-white' : 'bg-indigo-600 border-2 border-white'}`;
      markerElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

      if (window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: place.location,
          content: markerElement,
          title: displayTitle,
        });

        // Resolve translations for InfoWindow
        let infoWindowName = isEnriched ? isEnriched.customName : '';
        let infoWindowRole = isEnriched ? isEnriched.role : '';
        if (isEnriched && lang === 'en') {
            infoWindowName = translateTextToEn(isEnriched.customName);
            infoWindowRole = translateTextToEn(isEnriched.role);
        }
        
        // Extract Place Photo URI if available
        let photoHtml = '';
        if (place.photos && place.photos.length > 0) {
            try {
                const photoUri = place.photos[0].getURI({ maxWidth: 400 });
                photoHtml = `<img src="${photoUri}" alt="Location" style="width:100%; height:130px; object-fit:cover; border-radius:8px; margin-bottom:10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"/>`;
            } catch (e) { console.warn("Photo format issue", e); }
        }

        const infowindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 5px; font-family: sans-serif; line-height: 1.4; max-width: 250px;">
              ${photoHtml}
              <strong style="font-size: 14px; color: ${isEnriched ? '#10b981' : '#1e1b4b'}">${displayTitle}</strong><br>
              <span style="font-size: 11px; color: gray;">${place.formattedAddress}</span>
              ${isEnriched ? `
                <hr style="margin: 6px 0;" />
                <div style="font-size: 12px; background: #ecfdf5; padding: 8px; border-radius: 8px;">
                  <b>🧑 ${infoWindowName}</b> (${infoWindowRole})<br>
                  <b>📞 ${isEnriched.phone}</b>
                </div>
              ` : `
                <hr style="margin: 6px 0;" />
                <div style="font-size: 11px; background: #fffbeb; padding: 6px; border-radius: 6px; color: #b45309;">
                  ⚠️ ${t.localDataOnly}
                </div>
              `}
            </div>
          `,
        });

        marker.addListener("click", () => {
          infowindow.open({ anchor: marker, map: mapRef.current });
        });

        markersRef.current.push(marker);
      }
    });
  }, [enrichedData, lang, t.localDataOnly]);

  // FETCH NEARBY PLACES FROM GOOGLE PLACES API
  const fetchNearbyPlaces = useCallback(async (location) => {
    if (!mapRef.current) return;
    setIsLoading(true);
    lastFetchedCenter.current = location; 

    if (isOffline) {
      const mockPlaces = getFallbackPOIs(location.lat, location.lng);
      setPlaces(mockPlaces);
      updateMarkers(mockPlaces);
      setIsLoading(false);
      return;
    }

    try {
      const request = {
        textQuery: 'school OR hospital OR clinic OR police OR local_government_office OR commune OR village',
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'types', 'photos'],
        locationBias: { center: location, radius: 25000 }, // Increased Radius to 25km (20-40km range)
        language: lang
      };
      const { places: newPlaces } = await window.google.maps.places.Place.searchByText(request);
      if (newPlaces) {
        setPlaces(newPlaces);
        updateMarkers(newPlaces);
      }
    } catch (error) {
      const mockPlaces = getFallbackPOIs(location.lat, location.lng);
      setPlaces(mockPlaces);
      updateMarkers(mockPlaces);
    } finally { setIsLoading(false); }
  }, [isOffline, updateMarkers, lang]);

  const handleMapIdle = useCallback(() => {
    if (!mapRef.current || !lastFetchedCenter.current || trackingError) return;
    const currentCenter = mapRef.current.getCenter();
    const lat1 = lastFetchedCenter.current.lat; const lon1 = lastFetchedCenter.current.lng;
    const lat2 = currentCenter.lat(); const lon2 = currentCenter.lng();
    if (calculateDistance(lat1, lon1, lat2, lon2) >= 0.5) {
      fetchNearbyPlaces({ lat: lat2, lng: lon2 });
    }
  }, [fetchNearbyPlaces, trackingError]);

  // Initialize Map
  useEffect(() => {
    if (!isApiLoaded || !mapElementRef.current || view !== 'user') return;

    const initialLocation = { lat: 11.5564, lng: 104.9282 }; 
    const map = new window.google.maps.Map(mapElementRef.current, {
      center: initialLocation,
      zoom: 14,
      mapId: "450ae928a2c49128", 
      mapTypeId: 'roadmap',
      mapTypeControl: true, // Enable native map type control
      streetViewControl: true, // Enable native Street View (Pegman)
      fullscreenControl: true, // Enable native Fullscreen
      zoomControl: true
    });
    mapRef.current = map;

    // Admin Add Data by Clicking on Map directly
    map.addListener("click", (e) => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        if (isAdminRef.current) {
          setPendingLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          setFormData({ name: '', phone: '', type: lang === 'km' ? 'សាលារៀន / នាយកសាលា' : 'School / Principal' });
          setShowAddModal(true);
        }
    });

    if (navigator.geolocation) {
      setGpsStatus(t.gpsSearching);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setTrackingError(false);
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos);
          setGpsStatus(t.gpsActive);
          
          if (userMarkerRef.current) {
            userMarkerRef.current.position = userPos;
          } else {
            const userIcon = document.createElement('div');
            userIcon.innerHTML = `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                <div class="w-8 h-8 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg transform scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>`;
            if (window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                position: userPos, map: map, content: userIcon, title: "ទីតាំងរបស់អ្នក", zIndex: 9999
              });
            }
            map.setCenter(userPos); 
            fetchNearbyPlaces(userPos); 
          }
        },
        (error) => {
          setTrackingError(true);
          setGpsStatus(t.gpsError);
          if (!lastFetchedCenter.current) fetchNearbyPlaces(initialLocation);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } else {
      setGpsStatus(t.gpsUnsupported);
      fetchNearbyPlaces(initialLocation);
    }

    map.addListener('idle', handleMapIdle);

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isApiLoaded, view]); 

  // Toggle Map Theme (Roadmap vs Satellite)
  const toggleMapTheme = () => {
     if (mapRef.current) {
        const newTheme = mapTheme === 'roadmap' ? 'satellite' : 'roadmap';
        mapRef.current.setMapTypeId(newTheme);
        setMapTheme(newTheme);
     }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true); setShowSuggestions(false);
    try {
      const request = { textQuery: searchQuery, fields: ['displayName', 'location', 'formattedAddress'], maxResultCount: 1, language: lang };
      const { places: searchResults } = await window.google.maps.places.Place.searchByText(request);
      if (searchResults && searchResults.length > 0 && searchResults[0].location) {
        const topResult = searchResults[0];
        mapRef.current.setCenter(topResult.location); mapRef.current.setZoom(16);
        fetchNearbyPlaces({ lat: topResult.location.lat(), lng: topResult.location.lng() });
      } else { showToast(lang === 'km' ? "រកមិនឃើញទីតាំងនេះទេ" : "Place not found", "error"); }
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    setShowSuggestions(true);
    try {
      const request = {
        textQuery: val,
        fields: ['displayName', 'location', 'formattedAddress'],
        maxResultCount: 5,
        language: lang
      };
      const { places: searchSuggestions } = await window.google.maps.places.Place.searchByText(request);
      if (searchSuggestions) setSuggestions(searchSuggestions);
    } catch (error) { console.warn("Suggestions error"); }
  };

  const selectSuggestion = (place) => {
    if (!place.location) return;
    setSearchQuery(getPlaceName(place, lang)); setShowSuggestions(false);
    mapRef.current.panTo(place.location); mapRef.current.setZoom(16);
    fetchNearbyPlaces({ lat: place.location.lat(), lng: place.location.lng() });
  };

  // ANALYTICS CALCULATIONS
  const totalUsersCount = visitorLogs.length;

  const stats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const yearMs = 365 * 24 * 60 * 60 * 1000;

    const lastWeek = visitorLogs.filter(log => (now - log.timestamp) < weekMs).length;
    const lastMonth = visitorLogs.filter(log => (now - log.timestamp) < monthMs).length;
    const lastYear = visitorLogs.filter(log => (now - log.timestamp) < yearMs).length;

    const weekPercent = totalUsersCount > 0 ? Math.round((lastWeek / totalUsersCount) * 100) : 0;
    const monthPercent = totalUsersCount > 0 ? Math.round((lastMonth / totalUsersCount) * 100) : 0;
    const yearPercent = totalUsersCount > 0 ? Math.round((lastYear / totalUsersCount) * 100) : 0;

    return { lastWeek, lastMonth, lastYear, weekPercent, monthPercent, yearPercent };
  }, [visitorLogs, totalUsersCount]);

  // ACTIONS
  const recenterMap = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(16);
    } else {
      showToast(t.gpsSearching, "info");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASS) {
      setView('admin_dashboard');
      setIsAdminUser(true); 
      setLoginError('');
      setAdminPassword(''); // clear it
      showToast(t.toastLoginSuccess, 'success');
    } else {
      setLoginError(t.toastLoginError);
      if (db && user) {
        try {
          let ip = 'Unknown';
          try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            ip = data.ip;
          } catch(e){ /* silent */ }
          
          // កត់ត្រាទុកអ្នកដែលប៉ុនប៉ងចូល (ប៉ុន្តែលាក់ Password ជាដាច់ខាត ហាមបញ្ចេញ)
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', Date.now().toString()), {
            ip, 
            device: navigator.userAgent, 
            attemptedPass: "លាក់សុវត្ថិភាព (Hidden)", 
            timestamp: Date.now() 
          });
        } catch (err) { /* no console logging */ }
      }
    }
  };

  const saveEnrichedData = async () => {
    if (!user || !db) return;
    
    try {
      if (pendingLocation && formData.name) {
         const newId = `loc-${Date.now()}`;
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), {
            placeId: newId, googleName: formData.name, customName: formData.name, role: formData.type, phone: formData.phone, lat: pendingLocation.lat, lng: pendingLocation.lng, timestamp: Date.now()
         });
         setShowAddModal(false);
         showToast(t.toastSaveSuccess, "success");
      }
      else if (editingPlace) {
         if (!editingPlace.location) {
             showToast("ទីតាំងនេះមិនមានកូអរដោនេត្រឹមត្រូវទេ", "error");
             return;
         }
         
         if (!customInfo.name.trim()) {
             showToast("សូមបញ្ចូលឈ្មោះស្ថាប័ន ឬបុគ្គល", "error");
             return;
         }

         let editLat = typeof editingPlace.location.lat === 'function' ? editingPlace.location.lat() : editingPlace.location.lat;
         let editLng = typeof editingPlace.location.lng === 'function' ? editingPlace.location.lng() : editingPlace.location.lng;
         
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', editingPlace.id), {
            placeId: editingPlace.id, 
            googleName: getPlaceName(editingPlace, 'km'), 
            customName: customInfo.name, 
            role: customInfo.role, 
            phone: customInfo.phone, 
            lat: editLat,
            lng: editLng,
            timestamp: Date.now()
         });
         setEditingPlace(null); setCustomInfo({ name: '', role: '', phone: '' });
         showToast(t.toastSaveSuccess, "success");
      }
    } catch (e) { showToast("មានបញ្ហាក្នុងការរក្សាទុក (Error saving)", "error"); console.error(e); }
  };

  const deleteEnrichedData = async (placeId) => {
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', placeId)); 
      showToast(t.toastDeleteSuccess, "success");
    } catch (e) { console.error(e); }
  };

  // Replaced window.confirm with custom modal interaction
  const requestClearSecurityLogs = () => {
    setConfirmDialog({
      isOpen: true,
      title: t.confirmClearTitle,
      message: t.confirmClearMsg,
      onConfirm: async () => {
        for (const log of securityLogs) {
          try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', log.id));
          } catch (e) { console.warn("Failed to delete log item", e); }
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null, title: '' });
        showToast("បានលុបកំណត់ហេតុសន្តិសុខទាំងអស់", "success");
      }
    });
  };

  const deleteSingleSecurityLog = async (logId) => {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', logId));
        showToast("បានលុបកំណត់ហេតុដោយជោគជ័យ", "success");
      } catch (e) { /* silent */ }
  };

  if (view === 'user') {
    return (
      <div className={`h-[100dvh] w-full relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Offline Alert */}
        {isOffline && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-bold shadow-md">
             {t.noInternet}
          </div>
        )}

        {/* Global Toast */}
        {toast.show && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[60] animate-bounce">
            <div className={`px-6 py-3 rounded-full shadow-xl text-white font-bold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
               {toast.type === 'success' && <CheckCircle className="w-4 h-4"/>}
               {toast.message}
            </div>
          </div>
        )}

        {/* TOP SEARCH BAR (Floating on Mobile) */}
        <div className={`absolute top-4 left-4 right-4 md:w-[400px] z-40 transition-all`}>
           <div className={`flex flex-col gap-2 p-3 rounded-2xl shadow-lg border backdrop-blur-md ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
              <div className="flex justify-between items-center px-1">
                <h1 className={`font-black flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <MapPin className="mr-1 text-emerald-500 w-5 h-5" /> Smart Map VMC
                </h1>
                <div className="flex space-x-1">
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition">
                    {isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                  </button>
                  <button onClick={() => setView('admin_login')} className="p-2 rounded-full hover:bg-emerald-100 text-emerald-600 transition">
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSearchSubmit} className="relative mt-1">
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchBox}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-colors ${isDarkMode ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500'}`}
                />
                <Search className="absolute left-3.5 top-3.5 text-gray-400 w-5 h-5" onClick={handleSearchSubmit} />
                {isSearching && <div className="absolute right-3.5 top-3.5 animate-spin rounded-full h-4 w-4 border-2 border-t-emerald-500"></div>}
              </form>
           </div>
        </div>

        {/* FULLSCREEN LEAFLET MAP (Only ONE Map now) */}
        <div ref={mapElementRef} className="absolute inset-0 z-0 bg-gray-100" />
        
        {/* Floating Map Actions (Right Side - Only ONE set of buttons) */}
        <div className="absolute top-1/3 right-4 z-20 flex flex-col gap-3">
          <button onClick={toggleMapTheme} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition border ${mapTheme === 'satellite' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700'}`} title="ប្តូរទម្រង់ផែនទី (Map View)">
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={recenterMap} className="w-12 h-12 bg-white dark:bg-gray-800 text-emerald-600 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center transition hover:bg-emerald-50" title="ត្រឡប់មកទីតាំងខ្ញុំវិញ (Recenter)">
            <Crosshair className="w-5 h-5" />
          </button>
        </div>

        {/* Live GPS Status */}
        {gpsStatus && (
          <div className="absolute top-[130px] right-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">
            <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
            {gpsStatus}
          </div>
        )}

        {/* BOTTOM SHEET FOR PLACES (Mobile Friendly) */}
        <div className={`absolute bottom-0 left-0 w-full md:w-[400px] md:left-4 md:bottom-4 flex flex-col transition-all duration-500 ease-in-out z-40 ${isBottomSheetOpen ? 'h-[70vh] md:h-[60vh]' : 'h-[30vh] md:h-[40vh]'} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t md:border shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-3xl md:rounded-3xl`}>
          {/* Handle to open/close sheet on mobile */}
          <div className="w-full flex justify-center pt-3 pb-2 md:hidden" onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}>
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer"></div>
          </div>
          
          <div className="px-5 pb-3 pt-2 md:pt-5 border-b dark:border-gray-700 flex justify-between items-center">
             <h2 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">{t.nearbyPlaces} ({places.length})</h2>
             <button onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)} className="md:hidden text-emerald-600 font-bold text-xs">
                {isBottomSheetOpen ? 'បង្រួម' : 'ពង្រីក'}
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
            ) : places.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-500">{t.noPlaces}</p>
            ) : (
              <ul className="space-y-3 pb-10">
                {places.map((place) => {
                  const types = place.types || [];
                  let Icon = Building2;
                  if (types.includes('school') || types.includes('college')) Icon = GraduationCap;
                  if (types.includes('hospital') || types.includes('clinic')) Icon = Activity;
                  if (types.includes('police')) Icon = ShieldAlert;
                  if (types.includes('townhall')) Icon = Globe;

                  const isEnriched = enrichedData[place.id]; 
                  const typeSuffix = getPlaceTypeName(types, lang);
                  
                  return (
                    <li key={place.id} className={`p-3.5 border rounded-2xl flex flex-col shadow-sm cursor-pointer transition ${isEnriched ? 'bg-emerald-50/50 border-emerald-300 dark:bg-gray-700 dark:border-emerald-500' : 'bg-white border-gray-100 hover:border-emerald-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                      <div className="flex items-start" onClick={() => { if(mapRef.current && window.google) { mapRef.current.panTo(place.location); mapRef.current.setZoom(16); setIsBottomSheetOpen(false); } }}>
                        <div className={`p-2.5 rounded-xl mr-3 ${isEnriched ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden pt-0.5">
                          <h3 className="font-bold text-[14px] leading-tight truncate dark:text-gray-100">{getPlaceName(place, lang)}{typeSuffix}</h3>
                          <p className="text-[11px] mt-1 truncate text-gray-500 dark:text-gray-400">{place.formattedAddress}</p>
                        </div>
                      </div>
                      
                      {isEnriched ? (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-[13px] font-bold flex items-center mb-1 text-emerald-700 dark:text-emerald-400"><User className="w-3.5 h-3.5 mr-1"/> {isEnriched.customName} ({isEnriched.role})</p>
                              <p className="text-[12px] font-bold flex items-center text-emerald-600"><Phone className="w-3.5 h-3.5 mr-1"/> {isEnriched.phone}</p>
                            </div>
                            {isAdminUser && (
                              <button onClick={(e) => { e.stopPropagation(); deleteEnrichedData(place.id); }} className="p-1.5 bg-red-100 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                          <a href={`tel:${isEnriched.phone}`} className="mt-1 py-2 w-full rounded-xl text-center font-bold text-[13px] flex items-center justify-center bg-emerald-600 text-white shadow-md">
                            <PhoneCall className="w-4 h-4 mr-2" /> {t.callBtn}
                          </a>
                        </div>
                      ) : (
                        <div className="mt-2 text-center py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                           <span className="text-[10px] font-bold text-amber-600">{t.localDataOnly}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Modal for Admin Adding Data via Map Click */}
        {showAddModal && pendingLocation && isAdminUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="p-6 rounded-3xl w-full max-w-sm bg-white shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center text-gray-900"><MapPin className="text-emerald-500 mr-2" /> បន្ថែមទីតាំងថ្មី</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 p-1 bg-gray-100 rounded-full hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="ឈ្មោះស្ថាប័ន / បុគ្គល" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 focus:border-emerald-500 outline-none text-sm font-semibold" />
                <input type="tel" placeholder="លេខទូរស័ព្ទ" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 focus:border-emerald-500 outline-none text-sm font-semibold" />
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 focus:border-emerald-500 outline-none text-sm font-semibold">
                  <option value="សាលារៀន / នាយកសាលា">សាលារៀន / នាយកសាលា</option>
                  <option value="មន្ទីរពេទ្យ / គ្លីនិក">មន្ទីរពេទ្យ / គ្លីនិក</option>
                  <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                  <option value="សាលាឃុំ / ផ្ទះមេភូមិ">សាលាឃុំ / ផ្ទះមេភូមិ</option>
                </select>
              </div>
              <button onClick={saveEnrichedData} className="w-full mt-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                <Save className="w-5 h-5" /> រក្សាទុកទិន្នន័យ
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'admin_login') {
    return (
      <div className={`h-screen w-full flex items-center justify-center px-4 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-900'}`}>
        {toast.show && (
          <div className="absolute top-6 z-50 animate-bounce">
            <div className={`px-6 py-3 rounded-full shadow-xl text-white font-bold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
               {toast.type === 'success' && <CheckCircle className="w-4 h-4"/>}
               {toast.message}
            </div>
          </div>
        )}
        <div className={`max-w-md w-full rounded-3xl shadow-2xl p-8 relative border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-transparent'}`}>
          <button onClick={() => setView('user')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 transition-colors"><X className="w-6 h-6" /></button>
          
          <div className="flex justify-center mb-6 mt-4">
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 rounded-full shadow-inner border border-emerald-100">
              <Lock className="w-12 h-12 text-emerald-600" />
            </div>
          </div>
          <h2 className={`text-2xl font-black text-center mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.adminLogin}</h2>
          <p className="text-center text-gray-500 mb-8 text-sm">{t.verifyNotice}</p>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                placeholder={t.enterPass} 
                className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all font-medium ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-200 focus:border-emerald-500 text-gray-900'}`}
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)} 
              />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center font-bold animate-pulse">{loginError}</p>}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition active:scale-95">
              {t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'admin_dashboard') {
    return (
      <div className="h-screen w-full bg-gray-100 flex flex-col md:flex-row relative">
        
        {/* Custom Confirmation Dialog for Admin Actions */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
               <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
               <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
               <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmDialog({...confirmDialog, isOpen: false})} className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    {t.confirmNo}
                  </button>
                  <button onClick={confirmDialog.onConfirm} className="px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md">
                    {t.confirmYes}
                  </button>
               </div>
            </div>
          </div>
        )}

        {toast.show && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className={`px-6 py-3 rounded-full shadow-lg text-white font-bold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
               {toast.type === 'success' && <CheckCircle className="w-4 h-4"/>}
               {toast.message}
            </div>
          </div>
        )}
        <div className="w-full md:w-64 bg-gray-900 text-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-gray-800"><h2 className="text-xl font-bold flex items-center"><ShieldAlert className="mr-2 text-emerald-500"/> Admin Panel</h2></div>
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('locations')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'locations' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}><MapPin className="w-5 h-5 mr-3"/> {t.adminTabLoc}</button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}><BarChart3 className="w-5 h-5 mr-3"/> {t.adminTabRep}</button>
            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'security' ? 'bg-emerald-600' : 'hover:bg-gray-800'}`}><AlertTriangle className="w-5 h-5 mr-3"/> {t.adminTabSec}</button>
          </nav>
          <div className="p-4 border-t border-gray-800 mt-auto">
            <button onClick={() => { setView('user'); setAdminPassword(''); }} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center mb-2 transition"><MapPin className="w-4 h-4 mr-2"/> ត្រឡប់ទៅផែនទី</button>
            <button onClick={() => { setIsAdminUser(false); setView('user'); setAdminPassword(''); }} className="w-full bg-gray-700 hover:bg-red-600 py-2.5 rounded-lg text-sm font-bold text-gray-200 transition">{t.logoutBtn}</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in relative flex flex-col bg-gray-50">
          
          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-6 text-gray-800">គ្រប់គ្រងទិន្នន័យទីតាំង</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="font-bold mb-4 border-b pb-2 text-gray-800 flex items-center"><MapPin className="w-5 h-5 text-emerald-500 mr-2"/> ១. ទីតាំងជុំវិញអ្នក (រង្វង់ ២៥ គ.ម)</h3>
                  <div className="h-[400px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {places.map(place => (
                      <div key={place.id} onClick={() => setEditingPlace(place)} className={`p-3 border rounded-lg cursor-pointer transition ${enrichedData[place.id] ? 'border-emerald-400 bg-emerald-50' : 'hover:border-emerald-500 hover:bg-emerald-50'}`}>
                        <p className={`font-bold text-sm ${enrichedData[place.id] ? 'text-emerald-800' : 'text-gray-900'}`}>{getPlaceName(place, lang)}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{place.formattedAddress}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border p-5 border-l-4 border-l-blue-500">
                    <h3 className="font-bold mb-4 border-b pb-2 text-gray-800">២. បន្ថែមព័ត៌មានលម្អិត</h3>
                    {editingPlace ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold bg-blue-50 p-2.5 rounded-lg text-blue-800 border border-blue-100 flex items-center">
                           <Building2 className="w-4 h-4 mr-2"/> ទីតាំងកំពុងរៀបចំ៖ {getPlaceName(editingPlace, lang)}
                        </p>
                        <input type="text" placeholder="ឈ្មោះស្ថាប័ន ឬបុគ្គល (ឧ. លោក សុខ)" className="w-full border-2 focus:border-blue-500 p-3 rounded-lg outline-none font-medium text-sm bg-white transition" value={customInfo.name} onChange={e => setCustomInfo({...customInfo, name: e.target.value})} />
                        <input type="text" placeholder="តួនាទី (ឧ. មេភូមិ / នាយកសាលា)" className="w-full border-2 focus:border-blue-500 p-3 rounded-lg outline-none font-medium text-sm bg-white transition" value={customInfo.role} onChange={e => setCustomInfo({...customInfo, role: e.target.value})} />
                        <input type="text" placeholder="លេខទូរស័ព្ទ (ឧ. 012 345 678)" className="w-full border-2 focus:border-blue-500 p-3 rounded-lg outline-none font-medium text-sm bg-white transition" value={customInfo.phone} onChange={e => setCustomInfo({...customInfo, phone: e.target.value})} />
                        <button onClick={saveEnrichedData} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md transition flex items-center justify-center gap-2">
                          <Save className="w-4 h-4"/> រក្សាទុកទិន្នន័យនេះ
                        </button>
                      </div>
                    ) : (<p className="text-sm text-gray-500 italic py-10 text-center bg-gray-50 rounded-lg border border-dashed">សូមជ្រើសរើសទីតាំងណាមួយពីបញ្ជីខាងឆ្វេងសិន...</p>)}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-5 border-l-4 border-l-emerald-500">
                    <h3 className="font-bold mb-4 border-b pb-2 text-gray-800">៣. ទិន្នន័យបានបញ្ចូលរួច</h3>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                      {Object.values(enrichedData).map(data => (
                        <div key={data.placeId} className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg hover:bg-emerald-50 transition-colors">
                          <div>
                             <p className="font-bold text-[13px] text-emerald-700">{data.googleName}</p>
                             <p className="text-xs font-semibold mt-1 text-gray-700">{data.customName} - <span className="text-emerald-600">{data.phone}</span></p>
                          </div>
                          <button onClick={() => deleteEnrichedData(data.placeId)} className="text-red-500 p-2 hover:bg-red-100 hover:text-red-700 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                      {Object.keys(enrichedData).length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">មិនទាន់មានទិន្នន័យទេ</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REPORTS - PERSONAL DASHBOARD STYLE */}
          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col">
               <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-emerald-500 inline-block pb-1">{t.analyticTitle}</h1>
               
               {/* Dashboard Statistical Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Weekly Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <p className="text-blue-500 text-xs font-black uppercase tracking-wider mb-1 flex items-center"><Activity className="w-4 h-4 mr-1"/> {t.weekStat}</p>
                      <h2 className="text-4xl font-black mt-2 text-gray-900">{stats.lastWeek} <span className="text-sm text-gray-400 font-normal">នាក់</span></h2>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                        <span>{t.activeRate}</span>
                        <span className="text-blue-600">{stats.weekPercent}%</span>
                      </div>
                      <div className="w-full bg-blue-50 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.weekPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <p className="text-emerald-500 text-xs font-black uppercase tracking-wider mb-1 flex items-center"><BarChart3 className="w-4 h-4 mr-1"/> {t.monthStat}</p>
                      <h2 className="text-4xl font-black mt-2 text-gray-900">{stats.lastMonth} <span className="text-sm text-gray-400 font-normal">នាក់</span></h2>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                        <span>{t.activeRate}</span>
                        <span className="text-emerald-600">{stats.monthPercent}%</span>
                      </div>
                      <div className="w-full bg-emerald-50 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.monthPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Yearly Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <p className="text-purple-500 text-xs font-black uppercase tracking-wider mb-1 flex items-center"><Globe className="w-4 h-4 mr-1"/> {t.yearStat}</p>
                      <h2 className="text-4xl font-black mt-2 text-gray-900">{stats.lastYear} <span className="text-sm text-gray-400 font-normal">នាក់</span></h2>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                        <span>{t.activeRate}</span>
                        <span className="text-purple-600">{stats.yearPercent}%</span>
                      </div>
                      <div className="w-full bg-purple-50 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.yearPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Custom Bar Chart Simulation (Personalized Style) */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border flex-1 mb-8">
                 <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3"><BarChart3 className="text-emerald-500 w-5 h-5"/> ក្រាហ្វិកសសរស្ថិតិអ្នកប្រើប្រាស់ (User Traffic Chart)</h3>
                 
                 <div className="flex items-end justify-around h-56 mt-8 pt-4 border-l-2 border-b-2 border-gray-200 pb-2 relative px-4">
                    {/* Y-Axis labels */}
                    <div className="absolute left-[-30px] top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 font-bold py-2">
                      <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                    </div>
                    
                    {/* Week Bar */}
                    <div className="flex flex-col items-center group w-1/4 max-w-[80px]">
                      <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-1000 group-hover:opacity-80 flex items-start justify-center pt-2 shadow-md relative" style={{ height: `${Math.max(stats.weekPercent, 10)}%` }}>
                        <span className="text-white text-xs font-bold absolute -top-6 text-blue-600 drop-shadow-sm">{stats.weekPercent}%</span>
                      </div>
                      <span className="text-xs font-bold text-gray-600 mt-3 whitespace-nowrap">សប្តាហ៍នេះ</span>
                    </div>
                    
                    {/* Month Bar */}
                    <div className="flex flex-col items-center group w-1/4 max-w-[80px]">
                      <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-1000 group-hover:opacity-80 flex items-start justify-center pt-2 shadow-md relative" style={{ height: `${Math.max(stats.monthPercent, 10)}%` }}>
                         <span className="text-white text-xs font-bold absolute -top-6 text-emerald-600 drop-shadow-sm">{stats.monthPercent}%</span>
                      </div>
                      <span className="text-xs font-bold text-gray-600 mt-3 whitespace-nowrap">ខែនេះ</span>
                    </div>
                    
                    {/* Year Bar */}
                    <div className="flex flex-col items-center group w-1/4 max-w-[80px]">
                      <div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-1000 group-hover:opacity-80 flex items-start justify-center pt-2 shadow-md relative" style={{ height: `${Math.max(stats.yearPercent, 10)}%` }}>
                         <span className="text-white text-xs font-bold absolute -top-6 text-purple-600 drop-shadow-sm">{stats.yearPercent}%</span>
                      </div>
                      <span className="text-xs font-bold text-gray-600 mt-3 whitespace-nowrap">ឆ្នាំនេះ</span>
                    </div>
                 </div>
               </div>

               {/* General Overview Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-md text-white flex justify-between items-center hover:scale-[1.02] transition-transform">
                   <div>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.totalUsers}</p>
                     <p className="text-3xl font-black mt-2">{totalUsersCount}</p>
                   </div>
                   <div className="p-4 bg-gray-800 rounded-full border border-gray-700">
                      <User className="w-8 h-8 text-blue-400" />
                   </div>
                 </div>
                 
                 <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-md text-white flex justify-between items-center hover:scale-[1.02] transition-transform">
                   <div>
                     <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest">{t.addedPlaces}</p>
                     <p className="text-3xl font-black mt-2">{Object.keys(enrichedData).length}</p>
                   </div>
                   <div className="p-4 bg-emerald-700 rounded-full border border-emerald-600">
                      <MapPin className="w-8 h-8 text-white" />
                   </div>
                 </div>
               </div>

               <div className="mt-12 mb-6 text-center text-gray-500">
                  <p className="font-black text-sm uppercase tracking-wider mb-1">បង្កើតឡើងដោយយុវជន VMC វិ.ស.ស-2026</p>
                  <p className="text-xs font-semibold">@យុវជន VMC វិទ្យាល័យ ស្ដៅសន្តិភាព</p>
               </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="flex-1">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b-4 border-red-500 pb-1">
                 <h1 className="text-2xl font-black text-gray-800 flex items-center">សន្តិសុខប្រព័ន្ធ (ទប់ស្កាត់ការចូលខុស)</h1>
                 {/* Explicit "Clear" Button */}
                 <button onClick={requestClearSecurityLogs} className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 shadow-md transition flex items-center">
                    <Trash2 className="w-4 h-4 mr-2"/> Clear
                 </button>
               </div>
               <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                 <div className="overflow-x-auto w-full">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-red-50">
                       <tr>
                         <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">ម៉ោង/កាលបរិច្ឆេទ</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">IP Address</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Password ដែលវាយខុស</th>
                         <th className="px-6 py-4 text-right text-xs font-bold text-red-800 uppercase tracking-wider">ប្រតិបត្តិការ</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {securityLogs.map(log => (
                         <tr key={log.id} className="hover:bg-red-50/50 transition-colors">
                           <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('km-KH')}</td>
                           <td className="px-6 py-4 text-sm text-red-600 font-bold font-mono">{log.ip}</td>
                           <td className="px-6 py-4 text-sm text-gray-600">{log.attemptedPass}</td>
                           <td className="px-6 py-4 text-right">
                              <button onClick={() => deleteSingleSecurityLog(log.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="លុបកំណត់ត្រានេះ"><Trash2 className="w-4 h-4"/></button>
                           </td>
                         </tr>
                       ))}
                       {securityLogs.length === 0 && (
                         <tr>
                           <td colSpan="4" className="px-6 py-12 text-center">
                             <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                             <p className="text-emerald-600 font-bold text-lg">គ្មានការប៉ុនប៉ងចូលដោយខុសច្បាប់ទេ 🛡️ ប្រព័ន្ធមានសុវត្ថិភាព!</p>
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}