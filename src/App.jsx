import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, MapPin, Navigation, Building2, Store, GraduationCap, 
  ShieldAlert, Lock, User, Phone, Trash2, Activity, BarChart3, 
  Settings, AlertTriangle, X, Crosshair, Layers, 
  Loader2, Moon, Sun, Globe, PhoneCall, Save, List
} from 'lucide-react';

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
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
  // Console error removed as requested
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
// 2. TRANSLATION DICTIONARY (ខ្មែរ 🇰🇭 / English 🇺🇸)
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
    notSetLabel: "NO ! លេខ និងតួនាទីមិនទាន់បញ្ជាក់"
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
    notSetLabel: "NO ! Contact & Role unassigned"
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
  
  // Mobile Web App State: 'map' or 'list'
  const [mobileTab, setMobileTab] = useState('map');

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
  const [mapTheme, setMapTheme] = useState('roadmap'); // 'roadmap' or 'satellite'
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });

  const mapRef = useRef(null);          
  const mapElementRef = useRef(null);   
  const userMarkerRef = useRef(null);
  const markersRef = useRef([]);        
  const lastFetchedCenter = useRef(null); 
  const watchIdRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Google Maps API Key
  const API_KEY = "AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg"; 
  const ADMIN_PASS = "ict168mit";

  // Global Toast function
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, [setToast]);

  // ==========================================
  // FIREBASE INITIALIZATION & SECURITY
  // ==========================================
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {}
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !sessionStorage.getItem('hasLoggedVisit') && db) {
        try {
          const docId = Date.now().toString() + "-" + Math.floor(Math.random()*1000);
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visitor_stats', docId), { 
            uid: currentUser.uid, timestamp: Date.now(), userAgent: navigator.userAgent 
          }).catch(err => {});
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
    }, (error) => {});

    const securityRef = collection(db, 'artifacts', appId, 'public', 'data', 'security_logs');
    const unsubSecurity = onSnapshot(securityRef, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => { logs.push({ id: doc.id, ...doc.data() }); });
      setSecurityLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => {});

    const visitorRef = collection(db, 'artifacts', appId, 'public', 'data', 'visitor_stats');
    const unsubVisitor = onSnapshot(visitorRef, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => { logs.push({ id: doc.id, ...doc.data() }); });
      setVisitorLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => {});

    return () => { unsubRamit(); unsubSecurity(); unsubVisitor(); };
  }, [user]);

  // ==========================================
  // GOOGLE MAPS LOADER
  // ==========================================
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsApiLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,marker&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsApiLoaded(true);
    script.onerror = () => showToast("មិនអាចផ្ទុក Google Maps API បានទេ", "error");
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [showToast]);

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
      markerElement.className = `p-2 rounded-full shadow-lg text-white flex items-center justify-center transition-all ${isEnriched ? 'bg-emerald-600 border-2 border-white scale-110' : 'bg-indigo-600 border-2 border-white'}`;
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

        const infowindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 5px; font-family: sans-serif; line-height: 1.4; max-width: 250px;">
              <strong style="font-size: 14px; color: ${isEnriched ? '#10b981' : '#1e1b4b'}">${displayTitle}</strong><br>
              <span style="font-size: 11px; color: gray;">${place.formattedAddress}</span>
              ${isEnriched ? `
                <hr style="margin: 6px 0;" />
                <div style="font-size: 12px; background: #ecfdf5; padding: 8px; border-radius: 8px;">
                  <b style="color: #047857;">🧑 ${infoWindowName}</b> (${infoWindowRole})<br>
                  <b style="color: #047857;">📞 ${isEnriched.phone}</b>
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
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'types'],
        locationBias: { center: location, radius: 8000 },
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
      mapTypeControl: false,
      streetViewControl: false, 
      fullscreenControl: false,
      zoomControl: false,
      gestureHandling: "greedy" // Better mobile interaction
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
                <div class="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-30"></div>
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

  // ==========================================
  // SEARCH FUNCTIONALITY
  // ==========================================
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
        setMobileTab('map'); // Return to map view on mobile
      } else { showToast(lang === 'km' ? "រកមិនឃើញទីតាំងនេះទេ" : "Place not found", "error"); }
    } catch (error) {} finally { setIsSearching(false); }
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
    } catch (error) {}
  };

  const selectSuggestion = (place) => {
    if (!place.location) return;
    setSearchQuery(getPlaceName(place, lang)); setShowSuggestions(false);
    mapRef.current.panTo(place.location); mapRef.current.setZoom(16);
    fetchNearbyPlaces({ lat: place.location.lat(), lng: place.location.lng() });
    setMobileTab('map'); // Switch back to map on mobile
  };

  // ==========================================
  // ANALYTICS CALCULATIONS (ស្ថិតិភាគរយ %)
  // ==========================================
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

  // ==========================================
  // ACTIONS
  // ==========================================
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
          } catch(e){}
          // Fixed Security Logging Document ID to be unique and correctly structured
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', Date.now().toString()), {
            ip, device: navigator.userAgent, attemptedPass: adminPassword, timestamp: Date.now()
          });
        } catch (err) {}
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

         // Robust Lat/Lng extraction for Google Places API
         let editLat = typeof editingPlace.location.lat === 'function' ? editingPlace.location.lat() : editingPlace.location.lat;
         let editLng = typeof editingPlace.location.lng === 'function' ? editingPlace.location.lng() : editingPlace.location.lng;
         
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', editingPlace.id), {
            placeId: editingPlace.id, 
            googleName: getPlaceName(editingPlace, 'km'), // Store original Khmer name for base
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
    } catch (e) { 
        showToast("មានបញ្ហាក្នុងការរក្សាទុក (Error saving)", "error"); 
    }
  };

  const deleteEnrichedData = async (placeId) => {
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', placeId)); 
      showToast(t.toastDeleteSuccess, "success");
    } catch (e) {}
  };

  const clearSecurityLogs = async () => {
    if (!window.confirm("លុបកំណត់ហេតុទាំងអស់មែនទេ? (Clear all logs?)")) return;
    securityLogs.forEach(async (log) => {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', log.id));
      } catch (e) {}
    });
    showToast("បានលុបកំណត់ហេតុសន្តិសុខទាំងអស់", "success");
  };

  const deleteSingleSecurityLog = async (logId) => {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', logId));
        showToast("បានលុបកំណត់ហេតុដោយជោគជ័យ", "success");
      } catch (e) {}
  };

  // ==========================================
  // UI RENDER: USER (Smart Map) Web App
  // ==========================================
  if (view === 'user') {
    return (
      <div className={`flex h-[100dvh] w-full transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} overflow-hidden relative overscroll-none`}>
        
        {/* Offline Banner */}
        {isOffline && (
          <div className="absolute top-0 left-0 right-0 z-[60] bg-red-600 text-white text-center py-2 text-[13px] font-bold shadow-md animate-pulse">
             {t.noInternet}
          </div>
        )}

        {/* Global Toast */}
        {toast.show && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-[70] animate-bounce w-[90%] md:w-auto max-w-sm text-center">
            <div className={`px-6 py-3.5 rounded-full shadow-2xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
               {toast.message}
            </div>
          </div>
        )}

        {/* Left Sidebar (List/Search) - Absolute on Mobile, Relative on Desktop */}
        <div className={`absolute inset-0 z-40 md:relative md:z-30 w-full md:w-[350px] lg:w-[400px] flex-col shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} md:border-r pb-[68px] md:pb-0 ${mobileTab === 'list' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 relative shrink-0 z-10 bg-inherit">
            <div className="flex justify-between items-center mb-4 mt-1 md:mt-2">
              <h1 className={`text-[19px] md:text-xl font-black flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <MapPin className="mr-2 text-emerald-500 w-6 h-6 animate-bounce" /> {t.appTitle}
              </h1>
              
              {/* Top Right Tool Bar */}
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <button 
                  onClick={() => setLang(lang === 'km' ? 'en' : 'km')} 
                  className={`flex items-center px-2 md:px-2.5 py-1.5 rounded-full font-bold text-[11px] md:text-[12px] transition-all shadow-sm border ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-emerald-400 border-gray-600' : 'bg-white hover:bg-gray-50 text-emerald-600 border-emerald-200'}`}
                >
                  <span className="mr-1 md:mr-1.5">{lang === 'km' ? '🇰🇭' : '🇺🇸'}</span>
                  {lang === 'km' ? 'EN' : 'KH'}
                </button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="បិទ/បើកពន្លឺ">
                  {isDarkMode ? <Sun className="w-[18px] h-[18px] md:w-4 md:h-4"/> : <Moon className="w-[18px] h-[18px] md:w-4 md:h-4"/>}
                </button>
                <button onClick={() => setView('admin_login')} className={`hidden md:block p-2 rounded-full transition ${isAdminUser ? 'bg-emerald-100 text-emerald-600' : (isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')}`} title="Admin Panel">
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text" value={searchQuery} onChange={handleInputChange} onFocus={() => setShowSuggestions(true)}
                placeholder={t.searchBox}
                className={`w-full pl-11 pr-10 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-400' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500'} shadow-sm text-base md:text-sm font-medium`}
              />
              <Search className="absolute left-4 top-[15px] text-gray-400 w-5 h-5 cursor-pointer" onClick={handleSearchSubmit} />
              {isSearching && <div className="absolute right-4 top-[15px] animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>}
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={`absolute left-4 right-4 mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                {suggestions.map((place, idx) => (
                  <div key={idx} onClick={() => selectSuggestion(place)} className={`px-4 py-3.5 cursor-pointer border-b last:border-b-0 flex items-center ${isDarkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-50'}`}>
                    <MapPin className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                    <div className="overflow-hidden">
                      <p className={`font-bold text-[14px] md:text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{getPlaceName(place, lang)}</p>
                      <p className={`text-[12px] truncate mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{place.formattedAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
            {isOffline ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-sm">
                  <AlertTriangle className="w-5 h-5 mb-2 text-red-600" />
                  <p>{t.offlineNotice}</p>
                </div>
                <h2 className={`text-[11px] md:text-xs font-black uppercase tracking-wider mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.offlineMode}</h2>
                <ul className="space-y-3">
                  {offlineContacts.map((contact, idx) => {
                     const displayCustomName = lang === 'en' ? translateTextToEn(contact.customName) : contact.customName;
                     const displayRole = lang === 'en' ? translateTextToEn(contact.role) : contact.role;
                     const displayGoogleName = lang === 'en' ? translateTextToEn(contact.googleName) : contact.googleName;
                     
                     return (
                        <li key={idx} className={`p-4 rounded-xl border flex flex-col ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} shadow-sm`}>
                           <h3 className="font-bold text-[14px] mb-1">{displayGoogleName}</h3>
                           <p className="text-[13px] font-semibold flex items-center text-emerald-600"><User className="w-[14px] h-[14px] mr-1.5"/> {displayCustomName} ({displayRole})</p>
                           <a href={`tel:${contact.phone}`} className="mt-3.5 bg-emerald-600 text-white py-2.5 rounded-lg text-center font-bold text-[13px] flex items-center justify-center">
                             <PhoneCall className="w-4 h-4 mr-2" /> {t.callBtn} : {contact.phone}
                           </a>
                        </li>
                     )
                  })}
                  {offlineContacts.length === 0 && <p className="text-gray-500 text-sm text-center py-6">{t.noPlaces}</p>}
                </ul>
              </div>
            ) : (
              <>
                <h2 className={`text-[11px] md:text-xs font-black uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t.nearbyPlaces} ({places.length})
                </h2>
                {isLoading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
                ) : places.length === 0 ? (
                  <p className={`text-center py-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.noPlaces}</p>
                ) : (
                  <ul className="space-y-3 md:pb-20">
                    {places.map((place) => {
                      const types = place.types || [];
                      let Icon = Building2;
                      if (types.includes('school') || types.includes('university') || types.includes('primary_school')) Icon = GraduationCap;
                      if (types.includes('hospital') || types.includes('doctor') || types.includes('health') || types.includes('pharmacy')) Icon = Activity;
                      if (types.includes('police')) Icon = ShieldAlert;
                      if (types.includes('local_government_office') || types.includes('city_hall')) Icon = Globe;

                      const isEnriched = enrichedData[place.id]; 
                      const typeSuffix = getPlaceTypeName(types, lang);
                      const displayTitle = getPlaceName(place, lang) + typeSuffix;
                      
                      let displayCustomName = isEnriched ? isEnriched.customName : '';
                      let displayRole = isEnriched ? isEnriched.role : '';
                      if (isEnriched && lang === 'en') {
                          displayCustomName = translateTextToEn(isEnriched.customName);
                          displayRole = translateTextToEn(isEnriched.role);
                      }

                      return (
                        <li 
                          key={place.id} 
                          className={`p-4 md:p-3.5 border rounded-xl transition-all flex flex-col shadow-sm cursor-pointer hover:shadow-md
                            ${isDarkMode 
                              ? (isEnriched ? 'bg-gray-700 border-emerald-500' : 'bg-gray-800 border-gray-700 hover:border-emerald-500')
                              : (isEnriched ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-emerald-300')
                            }
                          `}
                        >
                          <div className="flex items-start" onClick={() => { 
                             mapRef.current?.panTo(place.location); 
                             mapRef.current?.setZoom(17); 
                             setMobileTab('map'); // Return to map on click
                          }}>
                            <div className={`p-2.5 rounded-xl mr-3 shrink-0 ${isEnriched ? (isDarkMode ? 'bg-emerald-900 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-gray-700 text-emerald-400' : 'bg-gray-100 text-gray-600')}`}>
                              <Icon className="w-[18px] h-[18px] md:w-5 md:h-5" />
                            </div>
                            <div className="flex-1 overflow-hidden pt-0.5">
                              <h3 className={`font-bold text-[14.5px] md:text-[14px] leading-tight truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{displayTitle}</h3>
                              <p className={`text-[12px] mt-1.5 md:mt-1 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{place.formattedAddress}</p>
                            </div>
                          </div>
                          
                          {isEnriched ? (
                            <div className={`mt-3.5 pt-3.5 border-t ${isDarkMode ? 'border-gray-600' : 'border-emerald-200/60'} flex flex-col`}>
                              <div className="flex justify-between items-start mb-2.5">
                                <div>
                                  <p className={`text-[13.5px] md:text-[13px] font-bold flex items-center mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
                                    <User className="w-[14px] h-[14px] mr-1.5"/> {displayCustomName} ({displayRole})
                                  </p>
                                  <p className={`text-[12.5px] md:text-[12px] font-bold flex items-center ${isDarkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>
                                    <Phone className="w-[14px] h-[14px] mr-1.5"/> {isEnriched.phone}
                                  </p>
                                </div>
                                {isAdminUser && (
                                  <button onClick={(e) => { e.stopPropagation(); deleteEnrichedData(place.id); }} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="លុបទិន្នន័យនេះ">
                                    <Trash2 className="w-[18px] h-[18px]" />
                                  </button>
                                )}
                              </div>
                              <a href={`tel:${isEnriched.phone}`} onClick={e => e.stopPropagation()} className={`mt-1 py-2.5 w-full rounded-xl text-center font-bold text-[13.5px] flex items-center justify-center transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-[0.98]`}>
                                <PhoneCall className="w-4 h-4 mr-2" /> {t.callBtn}
                              </a>
                            </div>
                          ) : (
                            <div className="mt-3 text-center py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                               <span className="text-[11px] font-bold text-red-500">{t.notSetLabel}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Map Area (Full screen on mobile) */}
        <div className={`absolute inset-0 z-10 md:relative md:z-0 flex-1 h-[100dvh] w-full pb-[68px] md:pb-0`}>
          <div ref={mapElementRef} className="w-full h-full" />
          
          {/* Floating Actions on Map */}
          <div className="absolute bottom-[84px] md:bottom-6 right-4 z-20 flex flex-col gap-3">
            <button 
              onClick={toggleMapTheme} 
              className="w-[52px] h-[52px] md:w-14 md:h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full shadow-2xl flex items-center justify-center active:scale-95 hover:scale-105 transition transform text-emerald-600 dark:text-emerald-400" 
              title="ប្តូរទម្រង់ផែនទី (ផែនទីធម្មតា ឬ ផែនទីផ្កាយរណបបៃតង)"
            >
              <Layers className="w-6 h-6 md:w-6 md:h-6" />
            </button>
            <button onClick={recenterMap} className="w-[52px] h-[52px] md:w-14 md:h-14 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border border-gray-100 dark:border-gray-700 rounded-full shadow-2xl flex items-center justify-center active:scale-95 hover:scale-105 transition transform" title="ត្រឡប់មកទីតាំងខ្ញុំវិញ (Recenter)">
              <Crosshair className="w-6 h-6 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Floating Live GPS Status */}
          {gpsStatus && (
            <div className="absolute bottom-[84px] md:bottom-6 left-4 md:left-6 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2.5 md:py-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2 text-[11px] md:text-xs font-bold text-gray-700 dark:text-gray-200">
              <div className={`w-2.5 h-2.5 md:w-2 md:h-2 rounded-full ${userLocation ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></div>
              {gpsStatus}
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-[68px] bg-white dark:bg-gray-900 border-t dark:border-gray-800 flex z-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] pb-safe">
            <button onClick={() => setMobileTab('map')} className={`flex-1 flex flex-col items-center justify-center ${mobileTab==='map' ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'}`}>
                <MapPin className={`w-[22px] h-[22px] ${mobileTab==='map' ? 'fill-emerald-100 dark:fill-emerald-900/30' : ''}`} />
                <span className="text-[11px] font-bold mt-1.5">ផែនទី</span>
            </button>
            <button onClick={() => setMobileTab('list')} className={`flex-1 flex flex-col items-center justify-center ${mobileTab==='list' ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'}`}>
                <Search className="w-[22px] h-[22px]" />
                <span className="text-[11px] font-bold mt-1.5">ស្វែងរក</span>
            </button>
            <button onClick={() => setView('admin_login')} className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-emerald-600">
                <ShieldAlert className="w-[22px] h-[22px]" />
                <span className="text-[11px] font-bold mt-1.5">Admin</span>
            </button>
        </div>

        {/* Modal for Admin clicking on map to add data */}
        {showAddModal && pendingLocation && isAdminUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] overflow-y-auto">
            <div className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-transparent'}`}>
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <MapPin className="text-emerald-500" /> {t.addLocTitle}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold mb-1.5 dark:text-gray-300">{t.placeNameLabel}</label>
                  <input type="text" placeholder={t.placeHolderName} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white text-base md:text-sm outline-none" />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5 dark:text-gray-300">{t.phoneLabel}</label>
                  <input type="tel" placeholder={t.placeholderPhone} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white text-base md:text-sm outline-none" />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5 dark:text-gray-300">{t.typeLabel}</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white text-base md:text-sm outline-none">
                    <option value="សាលារៀន / នាយកសាលា">{t.selectSchool}</option>
                    <option value="មន្ទីរពេទ្យ / គ្លីនិក">{t.selectHospital}</option>
                    <option value="ប៉ុស្តិ៍ប៉ូលីស">{t.selectPolice}</option>
                    <option value="សាលាឃុំ / ផ្ទះមេភូមិ">{t.selectCommune}</option>
                  </select>
                </div>
              </div>
              <button onClick={saveEnrichedData} className="w-full mt-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex justify-center items-center gap-2 text-[15px] transition active:scale-95">
                <Save className="w-5 h-5" /> {t.saveBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // UI RENDER: ADMIN LOGIN
  // ==========================================
  if (view === 'admin_login') {
    return (
      <div className={`h-[100dvh] w-full flex items-center justify-center px-4 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        {toast.show && (
          <div className="absolute top-10 z-50 animate-bounce">
            <div className={`px-6 py-3 rounded-full shadow-xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>{toast.message}</div>
          </div>
        )}
        <div className={`max-w-md w-full rounded-3xl shadow-2xl p-8 relative border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-transparent'}`}>
          <button onClick={() => setView('user')} className={`absolute top-4 right-4 p-2 rounded-full transition ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}><X className="w-6 h-6" /></button>
          
          <div className="flex justify-center mb-6 mt-4">
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 rounded-full shadow-inner border border-emerald-100">
              <Lock className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <h2 className={`text-2xl font-black text-center mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.adminLogin}</h2>
          <p className="text-center text-gray-500 mb-8 text-[13px] px-2">{t.verifyNotice}</p>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-[15px] w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                placeholder={t.enterPass} 
                className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all font-medium text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-200 focus:border-emerald-500 text-gray-900'}`}
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)} 
              />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center font-bold animate-pulse">{loginError}</p>}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition active:scale-[0.98] text-[15px]">
              {t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI RENDER: ADMIN DASHBOARD
  // ==========================================
  if (view === 'admin_dashboard') {
    return (
      <div className="h-[100dvh] w-full bg-gray-50 md:bg-gray-100 flex flex-col md:flex-row relative">
        {toast.show && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className={`px-6 py-3 rounded-full shadow-lg text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>{toast.message}</div>
          </div>
        )}
        
        {/* Admin Navigation Sidebar (Top Nav on Mobile) */}
        <div className="w-full md:w-64 bg-gray-900 text-white flex flex-col shrink-0 z-20 shadow-lg">
          <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold flex items-center"><ShieldAlert className="mr-2 text-red-500 w-5 h-5"/> Admin Panel</h2>
            <button onClick={() => { setView('user'); setAdminPassword(''); }} className="md:hidden p-2 bg-gray-800 rounded-full text-gray-300 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          <nav className="flex overflow-x-auto md:flex-col p-3 md:p-4 space-x-2 md:space-x-0 md:space-y-2 border-b md:border-b-0 border-gray-800 custom-scrollbar shrink-0">
            <button onClick={() => setActiveTab('locations')} className={`whitespace-nowrap flex items-center px-4 py-2 md:p-3 rounded-lg text-[13px] md:text-sm font-bold transition ${activeTab === 'locations' ? 'bg-emerald-600' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2"/> {t.adminTabLoc}</button>
            <button onClick={() => setActiveTab('reports')} className={`whitespace-nowrap flex items-center px-4 py-2 md:p-3 rounded-lg text-[13px] md:text-sm font-bold transition ${activeTab === 'reports' ? 'bg-emerald-600' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2"/> {t.adminTabRep}</button>
            <button onClick={() => setActiveTab('security')} className={`whitespace-nowrap flex items-center px-4 py-2 md:p-3 rounded-lg text-[13px] md:text-sm font-bold transition ${activeTab === 'security' ? 'bg-emerald-600' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-2"/> {t.adminTabSec}</button>
          </nav>
          <div className="hidden md:block p-4 border-t border-gray-800 mt-auto">
            <button onClick={() => { setView('user'); setAdminPassword(''); }} className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg text-sm font-bold flex items-center justify-center mb-3 transition active:scale-95"><MapPin className="w-4 h-4 mr-2"/> ត្រឡប់ទៅផែនទី</button>
            <button onClick={() => { setIsAdminUser(false); setView('user'); setAdminPassword(''); }} className="w-full bg-gray-800 border border-gray-700 hover:bg-red-600 hover:border-red-600 py-3 rounded-lg text-sm font-bold text-gray-300 transition active:scale-95">{t.logoutBtn}</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in relative flex flex-col pb-20 md:pb-8">
          
          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">គ្រប់គ្រងទិន្នន័យទីតាំង</h1>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-5">
                  <h3 className="font-bold mb-3 md:mb-4 border-b pb-2 text-[14px] md:text-base">១. ទីតាំងជុំវិញអ្នក (រង្វង់ ៨ គ.ម)</h3>
                  <div className="h-[300px] md:h-[400px] overflow-y-auto space-y-2.5 custom-scrollbar pr-2">
                    {places.map(place => (
                      <div key={place.id} onClick={() => setEditingPlace(place)} className={`p-3 md:p-3.5 border rounded-xl cursor-pointer transition active:scale-[0.98] ${enrichedData[place.id] ? 'border-emerald-300 bg-emerald-50' : 'hover:border-emerald-400 bg-gray-50 hover:bg-white'}`}>
                        <p className={`font-bold text-[13px] md:text-sm ${enrichedData[place.id] ? 'text-emerald-800' : 'text-gray-900'}`}>{getPlaceName(place, lang)}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 mt-1 truncate">{place.formattedAddress}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-5 border-l-4 border-l-blue-500">
                    <h3 className="font-bold mb-3 md:mb-4 border-b pb-2 text-[14px] md:text-base">២. បន្ថែមព័ត៌មានលម្អិត</h3>
                    {editingPlace ? (
                      <div className="space-y-3">
                        <p className="text-[12px] md:text-sm font-bold bg-blue-50 text-blue-800 p-2.5 rounded-lg border border-blue-100">កំពុងរៀបចំ៖ {getPlaceName(editingPlace, lang)}</p>
                        <input type="text" placeholder="ឈ្មោះស្ថាប័ន ឬបុគ្គល (ឧ. លោក សុខ)" className="w-full border-2 border-gray-200 focus:border-blue-500 p-3.5 rounded-xl outline-none font-medium text-base md:text-sm bg-gray-50" value={customInfo.name} onChange={e => setCustomInfo({...customInfo, name: e.target.value})} />
                        <input type="text" placeholder="តួនាទី (ឧ. មេភូមិ / នាយកសាលា)" className="w-full border-2 border-gray-200 focus:border-blue-500 p-3.5 rounded-xl outline-none font-medium text-base md:text-sm bg-gray-50" value={customInfo.role} onChange={e => setCustomInfo({...customInfo, role: e.target.value})} />
                        <input type="tel" placeholder="លេខទូរស័ព្ទ (ឧ. 012 345 678)" className="w-full border-2 border-gray-200 focus:border-blue-500 p-3.5 rounded-xl outline-none font-medium text-base md:text-sm bg-gray-50" value={customInfo.phone} onChange={e => setCustomInfo({...customInfo, phone: e.target.value})} />
                        <button onClick={saveEnrichedData} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition active:scale-[0.98]">រក្សាទុកទិន្នន័យនេះ</button>
                      </div>
                    ) : (<p className="text-[13px] md:text-sm text-gray-500 italic py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">សូមជ្រើសរើសទីតាំងណាមួយពីបញ្ជីខាងឆ្វេងសិន...</p>)}
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-5 border-l-4 border-l-emerald-500">
                    <h3 className="font-bold mb-3 md:mb-4 border-b pb-2 text-[14px] md:text-base">៣. ទិន្នន័យបានបញ្ចូលរួច</h3>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                      {Object.values(enrichedData).map(data => (
                        <div key={data.placeId} className="flex justify-between items-center p-3.5 bg-gray-50 border rounded-xl">
                          <div className="overflow-hidden pr-2">
                             <p className="font-bold text-[13px] md:text-[14px] text-emerald-800 truncate">{data.googleName}</p>
                             <p className="text-[11px] md:text-xs font-semibold mt-1 text-gray-600 truncate">{data.customName} - {data.phone}</p>
                          </div>
                          <button onClick={() => deleteEnrichedData(data.placeId)} className="text-red-500 p-2.5 bg-white border shadow-sm hover:bg-red-50 rounded-lg transition active:scale-95 shrink-0"><Trash2 className="w-4 h-4 md:w-5 md:h-5"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REPORTS (ស្ថិតិភាគរយ % តាមសប្តាហ៍ ខែ ឆ្នាំ) */}
          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col">
               <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">{t.analyticTitle}</h1>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-blue-500 relative overflow-hidden">
                    <p className="text-gray-400 text-[11px] md:text-xs font-black uppercase tracking-wider">{t.weekStat}</p>
                    <h2 className="text-3xl md:text-4xl font-black mt-1.5 md:mt-2 text-gray-900">{stats.lastWeek} <span className="text-[13px] md:text-sm text-gray-400 font-normal">នាក់</span></h2>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] md:text-xs font-bold text-blue-600 mb-1.5">
                        <span>{t.activeRate}</span>
                        <span>{stats.weekPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.weekPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500 relative overflow-hidden">
                    <p className="text-gray-400 text-[11px] md:text-xs font-black uppercase tracking-wider">{t.monthStat}</p>
                    <h2 className="text-3xl md:text-4xl font-black mt-1.5 md:mt-2 text-gray-900">{stats.lastMonth} <span className="text-[13px] md:text-sm text-gray-400 font-normal">នាក់</span></h2>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] md:text-xs font-bold text-emerald-600 mb-1.5">
                        <span>{t.activeRate}</span>
                        <span>{stats.monthPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.monthPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-purple-500 relative overflow-hidden">
                    <p className="text-gray-400 text-[11px] md:text-xs font-black uppercase tracking-wider">{t.yearStat}</p>
                    <h2 className="text-3xl md:text-4xl font-black mt-1.5 md:mt-2 text-gray-900">{stats.lastYear} <span className="text-[13px] md:text-sm text-gray-400 font-normal">នាក់</span></h2>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] md:text-xs font-bold text-purple-600 mb-1.5">
                        <span>{t.activeRate}</span>
                        <span>{stats.yearPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3">
                        <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.yearPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
               </div>

               {/* General Overview Card */}
               <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex-1">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-[15px] md:text-base"><Activity className="text-emerald-500 w-5 h-5"/> ស្ថិតិទូទៅ</h3>
                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                   <div className="p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                     <div>
                       <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">{t.totalUsers}</p>
                       <p className="text-xl md:text-2xl font-black mt-1 text-gray-800">{totalUsersCount}</p>
                     </div>
                     <User className="w-6 h-6 md:w-8 md:h-8 text-blue-500 opacity-50" />
                   </div>
                   <div className="p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                     <div>
                       <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">{t.addedPlaces}</p>
                       <p className="text-xl md:text-2xl font-black mt-1 text-gray-800">{Object.keys(enrichedData).length}</p>
                     </div>
                     <MapPin className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 opacity-50" />
                   </div>
                 </div>
               </div>

               {/* Custom Footer */}
               <div className="mt-8 md:mt-12 mb-4 md:mb-6 text-center text-gray-600 bg-gray-200 p-4 rounded-xl max-w-sm mx-auto shadow-sm">
                  <p className="font-black text-[12px] md:text-sm uppercase tracking-wider mb-1">បង្កើតឡើងដោយយុវជនVMC វិ.ស.ស-2026</p>
                  <p className="text-[11px] md:text-xs font-semibold">@យុវជន VMC វិទ្យាល័យ ស្ដៅសន្តិភាព</p>
               </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="flex-1">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                 <h1 className="text-xl md:text-2xl font-bold flex items-center text-red-600"><AlertTriangle className="mr-2"/> សន្តិសុខប្រព័ន្ធ</h1>
                 <button onClick={clearSecurityLogs} className="bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-black transition active:scale-95 shadow-md w-full md:w-auto">លុបកំណត់ហេតុទាំងអស់</button>
               </div>
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[11px] md:text-xs font-bold text-red-800 whitespace-nowrap">ម៉ោង/កាលបរិច្ឆេទ</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[11px] md:text-xs font-bold text-red-800 whitespace-nowrap">IP Address</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[11px] md:text-xs font-bold text-red-800 whitespace-nowrap">Password វាយខុស</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-right text-[11px] md:text-xs font-bold text-red-800 whitespace-nowrap">ប្រតិបត្តិការ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {securityLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 md:px-6 py-3.5 md:py-4 text-[12px] md:text-sm font-medium text-gray-800 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('km-KH')}</td>
                          <td className="px-4 md:px-6 py-3.5 md:py-4 text-[12px] md:text-sm text-red-600 font-bold whitespace-nowrap">{log.ip}</td>
                          <td className="px-4 md:px-6 py-3.5 md:py-4 text-[12px] md:text-sm text-gray-600 whitespace-nowrap">{log.attemptedPass}</td>
                          <td className="px-4 md:px-6 py-3.5 md:py-4 text-right whitespace-nowrap">
                             <button onClick={() => deleteSingleSecurityLog(log.id)} className="text-red-500 hover:text-red-700 bg-white border shadow-sm hover:bg-red-50 p-2 rounded-lg transition active:scale-95"><Trash2 className="w-4 h-4 md:w-5 md:h-5"/></button>
                          </td>
                        </tr>
                      ))}
                      {securityLogs.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-emerald-600 font-bold text-base bg-emerald-50/50">គ្មានការប៉ុនប៉ងចូលដោយខុសច្បាប់ទេ 🛡️ មានសុវត្ថិភាពខ្ពស់!</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}