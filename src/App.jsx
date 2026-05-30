import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, MapPin, Navigation, Building2, Store, GraduationCap, 
  ShieldAlert, Lock, User, Phone, Trash2, Activity, BarChart3, 
  Settings, AlertTriangle, X, Crosshair, Layers, 
  Loader2, Moon, Sun, Globe, PhoneCall, Save, List,
  Home, Compass, Grid, UserCircle, ArrowLeft, Star, Share2, Map,
  Menu, Bell, ChevronDown, Plus, Megaphone, MessageSquare, LayoutGrid, FileText
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
  // Console error removed
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
// 2. TRANSLATION DICTIONARY
// ==========================================
const dict = {
  km: {
    appTitle: "Smart Community Map",
    appSubtitle: "ដែនដីសហគមន៍ឆ្លាតវៃ",
    searchBox: "ស្វែងរកទីតាំង សាលា មន្ទីរពេទ្យ...",
    homeTab: "ទំព័រដើម",
    mapTab: "ផែនទី",
    categoriesTab: "ប្រភេទ",
    profileTab: "គណនី",
    reportTab: "ប្រកាស",
    newsTab: "ព័ត៌មាន",
    nearbyPlaces: "ទីតាំងសំខាន់ៗក្បែរអ្នក",
    seeAll: "មើលទាំងអស់",
    quickServices: "សេវាកម្មរហ័ស",
    communityNews: "ព័ត៌មានសហគមន៍",
    school: "សាលា",
    hospital: "មន្ទីរពេទ្យ",
    market: "ផ្សារ",
    government: "សាលាឃុំសង្កាត់",
    bank: "ធនាគារ",
    police: "ប៉ូលីស",
    other: "ច្រើនទៀត",
    directions: "ការធ្វើដំណើរ",
    share: "ចែករំលែក",
    addressInfo: "អាសយដ្ឋាន",
    phoneInfo: "លេខទូរស័ព្ទ",
    hoursInfo: "ម៉ោងធ្វើការ",
    myLocation: "ទីតាំងរបស់អ្នក",
    adminBtn: "ប្រព័ន្ធគ្រប់គ្រង",
    offlineNotice: "អ្នកកំពុងប្រើប្រាស់ក្រៅបណ្តាញ",
    noInternet: "គ្មានអ៊ីនធឺណិតទេ",
    adminLogin: "ផ្ទៀងផ្ទាត់សិទ្ធិជា Admin",
    enterPass: "បញ្ចូលលេខសម្ងាត់...",
    loginBtn: "ចូលប្រើប្រាស់",
    saveBtn: "បញ្ជូនទិន្នន័យ (Submit)",
    placeNameLabel: "ឈ្មោះស្ថាប័ន ឬបុគ្គល",
    phoneLabel: "លេខទូរស័ព្ទទំនាក់ទំនង",
    typeLabel: "ប្រភេទស្ថាប័ន",
    gpsSearching: "កំពុងស្វែងរកទីតាំងរបស់អ្នក...",
    gpsError: "សូមបើក GPS លើទូរស័ព្ទរបស់អ្នក",
    gpsUnsupported: "ទូរស័ព្ទមិនគាំទ្រ GPS ឡើយ",
    totalUsers: "អ្នកប្រើសរុប",
    addedPlaces: "ទីតាំងបានបញ្ចូល",
    localDataOnly: "NO ! មិនទាន់មានទិន្នន័យទំនាក់ទំនង",
    addLocTitle: "រាយការណ៍ / បន្ថែមទិន្នន័យ (Report)",
    recenterBtn: "ទីតាំងខ្ញុំ",
    analyticTitle: "របាយការណ៍ និងស្ថិតិ",
    notSetLabel: "មិនទាន់បញ្ជាក់",
    callNow: "ទូរស័ព្ទ",
    reportIssue: "ប្រកាសបញ្ហា",
    events: "ព្រឹត្តិការណ៍",
    emergencyContacts: "លេខទំនាក់ទំនង",
    aiAssistant: "សំណួរ AI (Beta)"
  },
  en: {
    appTitle: "Smart Community Map",
    appSubtitle: "Intelligent Community Map",
    searchBox: "Search locations, schools...",
    homeTab: "Home",
    mapTab: "Map",
    categoriesTab: "Categories",
    profileTab: "Profile",
    reportTab: "Report",
    newsTab: "News",
    nearbyPlaces: "Nearby Places",
    seeAll: "See all",
    quickServices: "Quick Services",
    communityNews: "Community News",
    school: "School",
    hospital: "Hospital",
    market: "Market",
    government: "Govt Hall",
    bank: "Bank",
    police: "Police",
    other: "More",
    directions: "Directions",
    share: "Share",
    addressInfo: "Address",
    phoneInfo: "Phone",
    hoursInfo: "Hours",
    myLocation: "Your location",
    adminBtn: "Admin System",
    offlineNotice: "You are offline.",
    noInternet: "No Internet Connection",
    adminLogin: "Admin Login",
    enterPass: "Enter password...",
    loginBtn: "Login",
    saveBtn: "Submit",
    placeNameLabel: "Institution / Name",
    phoneLabel: "Contact Phone",
    typeLabel: "Institution Type",
    gpsSearching: "Searching location...",
    gpsError: "Please enable GPS",
    gpsUnsupported: "GPS not supported",
    totalUsers: "Total Users",
    addedPlaces: "Added Places",
    localDataOnly: "No official contact data",
    addLocTitle: "Report / Feedback",
    recenterBtn: "My Location",
    analyticTitle: "Analytics & Reports",
    notSetLabel: "Unassigned",
    callNow: "Call",
    reportIssue: "Report Issue",
    events: "Events",
    emergencyContacts: "Emergency",
    aiAssistant: "AI Assistant"
  }
};

const translateTextToEn = (text) => {
    if (!text || typeof text !== 'string') return String(text || '');
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
  if (place.displayName && place.displayName.text) name = place.displayName.text;
  else name = place.displayName || place.name || '';
  if (typeof name !== 'string') name = String(name);
  if (lang === 'en') name = translateTextToEn(name);
  return name;
};

// Map Categories based on the provided UI Image
const MAP_CATEGORIES = [
  { id: 'school', icon: GraduationCap, color: 'bg-blue-50 text-blue-600', query: 'school OR university OR primary_school' },
  { id: 'hospital', icon: Activity, color: 'bg-red-50 text-red-600', query: 'hospital OR clinic OR health' },
  { id: 'police', icon: ShieldAlert, color: 'bg-green-50 text-green-600', query: 'police' },
  { id: 'government', icon: Building2, color: 'bg-orange-50 text-orange-600', query: 'local_government_office OR city_hall OR commune' },
  { id: 'market', icon: Store, color: 'bg-purple-50 text-purple-600', query: 'market OR supermarket OR mall' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  // App Navigation State
  // 'home' | 'map' | 'categories' | 'profile' | 'place_detail' | 'report' | 'news'
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);

  const isAdminRef = useRef(isAdminUser);
  useEffect(() => { isAdminRef.current = isAdminUser; }, [isAdminUser]);

  const [lang, setLang] = useState('km'); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const t = dict[lang];

  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [enrichedData, setEnrichedData] = useState({});
  const [offlineContacts, setOfflineContacts] = useState([]); 
  const [securityLogs, setSecurityLogs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Geo-blocking state
  const [isBlocked, setIsBlocked] = useState(false);
  
  const [gpsStatus, setGpsStatus] = useState('');
  const [mapTheme, setMapTheme] = useState('roadmap');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });

  const mapRef = useRef(null);          
  const mapElementRef = useRef(null);   
  const userMarkerRef = useRef(null);
  const markersRef = useRef([]);        
  const lastFetchedCenter = useRef(null); 
  const watchIdRef = useRef(null);

  // Google Maps API Key
  const API_KEY = "AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg"; 
  const ADMIN_PASS = "ict168mit";

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message: String(message), type }); 
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  // ==========================================
  // GEO-BLOCKING THAILAND
  // ==========================================
  useEffect(() => {
    fetch('https://get.geojs.io/v1/ip/country.json')
      .then(res => res.json())
      .then(data => {
        if (data.country === 'TH' || data.country_3 === 'THA') {
          setIsBlocked(true);
        }
      })
      .catch(e => { /* Ignore network errors */ });
  }, []);

  // ==========================================
  // FIREBASE INITIALIZATION
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
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visitor_stats', docId), { uid: currentUser.uid, timestamp: Date.now() }).catch(err => {});
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

    const secRef = collection(db, 'artifacts', appId, 'public', 'data', 'security_logs');
    const unsubSec = onSnapshot(secRef, (snap) => {
        const logs = []; snap.forEach(d => logs.push({ id: d.id, ...d.data() })); setSecurityLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
    });

    const visRef = collection(db, 'artifacts', appId, 'public', 'data', 'visitor_stats');
    const unsubVis = onSnapshot(visRef, (snap) => {
        const logs = []; snap.forEach(d => logs.push({ id: d.id, ...d.data() })); setVisitorLogs(logs);
    });

    return () => { unsubRamit(); unsubSec(); unsubVis(); };
  }, [user]);

  // ==========================================
  // GOOGLE MAPS LOADER
  // ==========================================
  useEffect(() => {
    if (window.google && window.google.maps) { setIsApiLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,marker&v=beta`;
    script.async = true; script.defer = true;
    script.onload = () => setIsApiLoaded(true);
    script.onerror = () => showToast("Error loading Maps API", "error");
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, [showToast]);

  const updateMarkers = useCallback((newPlaces) => {
    markersRef.current.forEach(marker => { if (marker) marker.map = null; });
    markersRef.current = [];

    newPlaces.forEach(place => {
      if (!place.location || !place.id) return;
      const isEnriched = enrichedData[place.id];
      const displayTitle = getPlaceName(place, lang);

      const markerElement = document.createElement('div');
      // Colors based on UI design
      let markerColor = 'bg-blue-500';
      if (place.types?.includes('hospital')) markerColor = 'bg-red-500';
      if (place.types?.includes('police')) markerColor = 'bg-green-500';
      if (place.types?.includes('local_government_office')) markerColor = 'bg-orange-500';
      if (place.types?.includes('market')) markerColor = 'bg-purple-500';
      if (isEnriched) markerColor = 'bg-emerald-600 scale-110 shadow-lg';

      markerElement.className = `w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${markerColor}`;
      // Inner dot
      markerElement.innerHTML = `<div class="w-2.5 h-2.5 bg-white rounded-full"></div>`;

      if (window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current, position: place.location, content: markerElement, title: displayTitle,
        });

        marker.addListener("click", () => {
          let distance = 0;
          if (userLocation) {
             distance = calculateDistance(userLocation.lat, userLocation.lng, place.location.lat(), place.location.lng());
          }
          setSelectedPlaceDetail({ ...place, distance: distance.toFixed(1) });
          setActiveTab('place_detail');
        });
        markersRef.current.push(marker);
      }
    });
  }, [enrichedData, lang, userLocation]);

  // Request 30km radius
  const fetchPlacesByQuery = useCallback(async (location, customQuery = null) => {
    if (!mapRef.current) return;
    setIsLoading(true);
    lastFetchedCenter.current = location; 

    if (isOffline) { setPlaces(getFallbackPOIs(location.lat, location.lng)); setIsLoading(false); return; }

    try {
      const q = customQuery || 'school OR hospital OR clinic OR police OR commune OR market OR bank';
      const request = {
        textQuery: q,
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'types', 'rating', 'userRatingCount', 'regularOpeningHours', 'internationalPhoneNumber'],
        locationBias: { center: location, radius: 30000 }, 
        language: lang
      };
      const { places: newPlaces } = await window.google.maps.places.Place.searchByText(request);
      if (newPlaces) { setPlaces(newPlaces); updateMarkers(newPlaces); }
    } catch (error) {
      setPlaces(getFallbackPOIs(location.lat, location.lng));
    } finally { setIsLoading(false); }
  }, [isOffline, updateMarkers, lang]);

  // Handle map reparenting when tabs change
  useEffect(() => {
    if (!isApiLoaded || !mapElementRef.current) return;
    
    const targetId = activeTab === 'home' ? 'home-map-container' : 'full-map-container';
    const targetContainer = document.getElementById(targetId);
    
    if (targetContainer && mapElementRef.current) {
        targetContainer.appendChild(mapElementRef.current);
        if (window.google && window.google.maps && mapRef.current) {
             window.google.maps.event.trigger(mapRef.current, 'resize');
        }
    }
  }, [activeTab, isApiLoaded]);

  // Initial Map Setup
  useEffect(() => {
    if (!isApiLoaded || !mapElementRef.current) return;
    if (mapRef.current) return; 

    const initialLocation = { lat: 11.5564, lng: 104.9282 }; 
    const map = new window.google.maps.Map(mapElementRef.current, {
      center: initialLocation,
      zoom: 14,
      mapId: "450ae928a2c49128", 
      mapTypeId: mapTheme,
      mapTypeControl: false,
      streetViewControl: true, // Enabled Orange Man
      streetViewControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
      gestureHandling: "greedy" 
    });
    mapRef.current = map;

    map.addListener("click", (e) => {
        if (isAdminRef.current) {
          setPendingLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          setFormData({ name: '', phone: '', type: lang === 'km' ? 'សាលារៀន / នាយកសាលា' : 'School / Principal' });
          setShowAddModal(true);
        } else {
          setActiveTab(prev => prev === 'place_detail' ? 'map' : prev);
        }
    });

    if (navigator.geolocation) {
      setGpsStatus(t.gpsSearching);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos); setGpsStatus('');
          
          if (userMarkerRef.current) {
            userMarkerRef.current.position = userPos;
          } else {
            const userIcon = document.createElement('div');
            userIcon.innerHTML = `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-14 h-14 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                <div class="w-6 h-6 bg-blue-600 border-[3px] border-white rounded-full shadow-lg"></div>
              </div>`;
            if (window.google?.maps?.marker?.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                position: userPos, map: map, content: userIcon, zIndex: 9999
              });
            }
            map.setCenter(userPos); 
            fetchPlacesByQuery(userPos, selectedCategory?.query); 
          }
        },
        (error) => { setGpsStatus(t.gpsError); if (!lastFetchedCenter.current) fetchPlacesByQuery(initialLocation); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } else {
      setGpsStatus(t.gpsUnsupported); fetchPlacesByQuery(initialLocation);
    }

    map.addListener('idle', () => {
       if (!mapRef.current || !lastFetchedCenter.current) return;
       const c = mapRef.current.getCenter();
       if (calculateDistance(lastFetchedCenter.current.lat, lastFetchedCenter.current.lng, c.lat(), c.lng()) >= 2.0) { 
          fetchPlacesByQuery({lat: c.lat(), lng: c.lng()}, selectedCategory?.query);
       }
    });

    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isApiLoaded]); 

  useEffect(() => {
     if ((activeTab === 'map' || activeTab === 'home') && mapRef.current && userLocation) {
        fetchPlacesByQuery(userLocation, selectedCategory?.query);
     }
  }, [selectedCategory, activeTab, fetchPlacesByQuery, userLocation]);

  const toggleMapTheme = () => {
     if (mapRef.current) {
        const newTheme = mapTheme === 'roadmap' ? 'satellite' : 'roadmap';
        mapRef.current.setMapTypeId(newTheme); setMapTheme(newTheme);
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
        mapRef.current?.setCenter(topResult.location); mapRef.current?.setZoom(16);
        fetchPlacesByQuery({ lat: topResult.location.lat(), lng: topResult.location.lng() });
        setActiveTab('map'); 
      } else { showToast("Place not found", "error"); }
    } catch (error) {} finally { setIsSearching(false); }
  };

  const handleInputChange = async (e) => {
    const val = e.target.value; setSearchQuery(val);
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    setShowSuggestions(true);
    try {
      const request = { textQuery: val, fields: ['displayName', 'location', 'formattedAddress'], maxResultCount: 5, language: lang };
      const { places: searchSuggestions } = await window.google.maps.places.Place.searchByText(request);
      if (searchSuggestions) setSuggestions(searchSuggestions);
    } catch (error) {}
  };

  const selectSuggestion = (place) => {
    if (!place.location) return;
    setSearchQuery(getPlaceName(place, lang)); setShowSuggestions(false);
    mapRef.current?.panTo(place.location); mapRef.current?.setZoom(16);
    fetchPlacesByQuery({ lat: place.location.lat(), lng: place.location.lng() });
    setActiveTab('map'); 
  };

  const clearSearch = () => {
     setSearchQuery(''); setSuggestions([]); setShowSuggestions(false);
  }

  const recenterMap = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation); mapRef.current.setZoom(16);
    } else { showToast(t.gpsSearching, "info"); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASS) {
      setIsAdminUser(true); setLoginError(''); showToast(t.toastLoginSuccess, 'success');
    } else {
      setLoginError(t.toastLoginError);
      if (db && user) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', Date.now().toString()), {
            ip: 'Unknown', device: navigator.userAgent, attemptedPass: adminPassword, timestamp: Date.now()
          });
        } catch (err) {}
      }
    }
  };

  const saveEnrichedData = async () => {
    if (!user || !db) return;
    try {
      if (activeTab === 'place_detail' && selectedPlaceDetail) {
          if (!formData.name.trim()) return showToast("បញ្ចូលឈ្មោះ / Enter name", "error");
          let pLat = typeof selectedPlaceDetail.location.lat === 'function' ? selectedPlaceDetail.location.lat() : selectedPlaceDetail.location.lat;
          let pLng = typeof selectedPlaceDetail.location.lng === 'function' ? selectedPlaceDetail.location.lng() : selectedPlaceDetail.location.lng;
          
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', selectedPlaceDetail.id), {
             placeId: selectedPlaceDetail.id, 
             googleName: getPlaceName(selectedPlaceDetail, 'km'),
             customName: formData.name, 
             role: formData.type, 
             phone: formData.phone, 
             lat: pLat, lng: pLng, timestamp: Date.now()
          });
          setShowAddModal(false); showToast(t.toastSaveSuccess, "success");
      }
      else if (pendingLocation && formData.name) {
         const newId = `loc-${Date.now()}`;
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), {
            placeId: newId, googleName: formData.name, customName: formData.name, role: formData.type, phone: formData.phone, lat: pendingLocation.lat, lng: pendingLocation.lng, timestamp: Date.now()
         });
         setShowAddModal(false); showToast(t.toastSaveSuccess, "success");
      }
    } catch (e) { showToast("Error saving", "error"); }
  };

  const deleteEnrichedData = async (placeId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', placeId)); showToast(t.toastDeleteSuccess, "success"); } catch (e) {}
  };

  const totalUsersCount = visitorLogs.length;

  // ==========================================
  // THAILAND BLOCKED SCREEN
  // ==========================================
  if (isBlocked) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gray-100 p-6">
         <div className="text-center bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border-t-4 border-red-500">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600 font-bold mb-4">ប្រព័ន្ធមិនអនុញ្ញាតឱ្យប្រើប្រាស់នៅក្នុងតំបន់របស់អ្នកទេ។</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest">ERROR: GEO_BLOCKED</p>
         </div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER (Mobile App Container)
  // ==========================================
  return (
    <div className={`flex h-[100dvh] w-full justify-center bg-gray-200 text-gray-800 overflow-hidden relative overscroll-none font-sans`}>
       {/* Hidden actual map element to be reparented */}
       <div className="hidden">
           <div ref={mapElementRef} className="w-full h-full" />
       </div>

       {/* Mobile Constraint Wrapper */}
       <div className="w-full h-full max-w-[480px] bg-white relative shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
          
          <div className="flex-1 relative w-full h-full overflow-hidden bg-gray-50">
             
             {/* MAIN FEED (HOME TAB) */}
             {activeTab === 'home' && (
                <div className="absolute inset-0 z-20 pointer-events-auto overflow-y-auto custom-scrollbar pb-[90px] bg-[#f8f9fa]">
                   
                   {/* Header Area */}
                   <div className="bg-white px-5 pt-10 pb-4 shadow-sm relative z-30">
                      <div className="flex justify-between items-center mb-4">
                         <Menu className="w-[26px] h-[26px] text-gray-800" />
                         <div className="flex-1 flex flex-col items-center">
                            <div className="flex items-center">
                               <MapPin className="w-[22px] h-[22px] text-blue-600 mr-1" />
                               <h1 className="text-[18px] font-black text-gray-900 tracking-tight">{t.appTitle}</h1>
                            </div>
                            <p className="text-[11px] text-gray-500 font-bold tracking-wide mt-0.5">{t.appSubtitle}</p>
                         </div>
                         <div className="relative flex items-center gap-3">
                            <div className="relative">
                               <Bell className="w-[24px] h-[24px] text-gray-800" />
                               <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            </div>
                            <button type="button" onClick={() => setLang(lang === 'km' ? 'en' : 'km')} className="hidden sm:flex items-center gap-1 border rounded-full px-2 py-1">
                                <Globe className="w-3.5 h-3.5 text-gray-600" />
                                <span className="text-[10px] font-bold text-gray-700">{lang === 'km' ? 'EN' : 'KH'}</span>
                            </button>
                         </div>
                      </div>

                      {/* Top Search Bar */}
                      <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 mt-2">
                         <div className="relative flex-1">
                            <Search className="absolute left-4 top-[14px] text-gray-400 w-5 h-5" onClick={handleSearchSubmit} />
                            <input
                               type="text" value={searchQuery} onChange={handleInputChange} onFocus={() => setShowSuggestions(true)}
                               placeholder={t.searchBox}
                               className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 rounded-[18px] outline-none text-[14px] font-medium text-gray-800 focus:border-blue-500 transition shadow-inner"
                            />
                            {searchQuery && <X onClick={clearSearch} className="absolute right-4 top-[14px] text-gray-400 w-5 h-5 cursor-pointer hover:text-gray-600 bg-gray-200 rounded-full p-0.5" />}
                         </div>
                         <button type="button" className="w-[50px] h-[50px] bg-gray-50 border border-gray-200 rounded-[18px] flex items-center justify-center shrink-0">
                            <Settings className="w-5 h-5 text-gray-600" onClick={() => setActiveTab('categories')} />
                         </button>
                      </form>

                      {/* Search Suggestions in Home */}
                      {showSuggestions && suggestions.length > 0 && (
                         <div className="absolute left-5 right-5 mt-2 bg-white rounded-2xl shadow-2xl max-h-60 overflow-y-auto border border-gray-100 p-2 z-40">
                           {suggestions.map((p, i) => (
                             <div key={i} onClick={() => selectSuggestion(p)} className="px-4 py-3.5 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center border-b border-gray-50 last:border-0">
                                <MapPin className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                                <div className="overflow-hidden">
                                   <p className="font-bold text-sm text-gray-800 truncate">{getPlaceName(p, lang)}</p>
                                   <p className="text-xs text-gray-500 truncate mt-0.5">{p.formattedAddress}</p>
                                </div>
                             </div>
                           ))}
                         </div>
                      )}
                   </div>

                   {/* Categories Horizontal Scroll */}
                   <div className="flex overflow-x-auto custom-scrollbar gap-4 px-5 py-5 pb-3 bg-white mb-2">
                      {MAP_CATEGORIES.map(cat => {
                         const Icon = cat.icon;
                         return (
                           <div key={cat.id} onClick={() => { setSelectedCategory(cat); setActiveTab('map'); }} className="flex flex-col items-center cursor-pointer active:scale-95 transition shrink-0 w-[64px]">
                              <div className={`w-[54px] h-[54px] rounded-[18px] ${cat.color} flex items-center justify-center mb-2 shadow-sm border border-white`}>
                                 <Icon className="w-[24px] h-[24px]" />
                              </div>
                              <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">{t[cat.id]}</span>
                           </div>
                         )
                      })}
                      <div onClick={() => setActiveTab('categories')} className="flex flex-col items-center cursor-pointer active:scale-95 transition shrink-0 w-[64px]">
                         <div className="w-[54px] h-[54px] rounded-[18px] bg-gray-100 text-gray-600 flex items-center justify-center mb-2 shadow-sm border border-white">
                            <List className="w-[24px] h-[24px]" />
                         </div>
                         <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">{t.other}</span>
                      </div>
                   </div>

                   {/* The Map Widget */}
                   <div className="px-5 py-2">
                      <div id="home-map-container" className="w-full h-[220px] rounded-3xl overflow-hidden shadow-sm border border-gray-200 relative bg-gray-200">
                         {/* Map gets injected here by useEffect */}
                         <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-xl shadow-md text-[11px] font-bold text-blue-600 flex items-center z-20 pointer-events-none">
                            <MapPin className="w-3.5 h-3.5 mr-1" /> រាជធានីភ្នំពេញ
                         </div>
                         <button onClick={toggleMapTheme} className="absolute top-3 right-3 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 active:scale-95 z-20 border"><Layers className="w-4 h-4"/></button>
                      </div>
                   </div>

                   {/* Nearby Places Section */}
                   <div className="mt-2 bg-white pt-4 pb-1 shadow-sm">
                      <div className="flex justify-between items-center px-5 mb-3">
                         <h3 className="font-black text-[16px] text-gray-900 flex items-center"><MapPin className="w-[18px] h-[18px] text-blue-600 mr-1.5"/> {t.nearbyPlaces}</h3>
                         <button onClick={() => setActiveTab('map')} className="text-blue-600 text-[12px] font-bold">{t.seeAll}</button>
                      </div>
                      
                      <div className="flex overflow-x-auto custom-scrollbar gap-3 px-5 pb-5 pt-1 snap-x">
                         {places.length === 0 ? (
                             <p className="text-sm text-gray-400 py-4 px-2 w-full text-center">{isLoading ? 'Loading map data...' : t.noPlaces}</p>
                         ) : (
                             places.slice(0, 8).map((p, i) => {
                                let d = 0; if (userLocation) d = calculateDistance(userLocation.lat, userLocation.lng, p.location.lat(), p.location.lng());
                                const enriched = enrichedData[p.id];
                                let Icon = Building2; let iconColor = 'text-blue-600';
                                if (p.types?.includes('school')) { Icon = GraduationCap; iconColor = 'text-blue-600'; }
                                if (p.types?.includes('hospital')) { Icon = Activity; iconColor = 'text-red-600'; }
                                if (p.types?.includes('market')) { Icon = Store; iconColor = 'text-purple-600'; }
                                if (p.types?.includes('police')) { Icon = ShieldAlert; iconColor = 'text-green-600'; }
                                
                                return (
                                   <div key={i} onClick={() => { setSelectedPlaceDetail({...p, distance: d.toFixed(1)}); setActiveTab('place_detail'); }} className="snap-start w-[180px] shrink-0 bg-white p-4 rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col active:scale-[0.98] transition cursor-pointer">
                                      <div className="flex items-start mb-2.5">
                                         <Icon className={`w-[22px] h-[22px] ${iconColor} mt-0.5 shrink-0`} />
                                         <h4 className="font-bold text-[13px] text-gray-900 ml-2.5 leading-tight line-clamp-2">{getPlaceName(p, lang)}</h4>
                                      </div>
                                      <p className="text-[11px] font-bold text-gray-500 mb-2 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> {d > 0 ? `${d.toFixed(1)} km` : 'Near'}</p>
                                      <p className="text-[11px] font-bold text-gray-600 mb-4 flex items-center"><Phone className="w-3.5 h-3.5 mr-1.5"/> {enriched ? enriched.phone : (p.internationalPhoneNumber || 'N/A')}</p>
                                      
                                      <button className="w-full py-2.5 bg-blue-600 text-white rounded-[12px] text-[12px] font-bold shadow-md shadow-blue-200 mt-auto flex items-center justify-center">
                                         <PhoneCall className="w-3.5 h-3.5 mr-1.5"/> {t.callNow}
                                      </button>
                                   </div>
                                )
                             })
                         )}
                      </div>
                   </div>

                   {/* Quick Services Section */}
                   <div className="px-5 py-4 bg-white mt-2 shadow-sm">
                      <h3 className="font-black text-[16px] text-gray-900 mb-4">{t.quickServices}</h3>
                      <div className="grid grid-cols-4 gap-2">
                         <div onClick={() => { setFormData({ name: '', phone: '', type: 'school' }); setShowAddModal(true); }} className="flex flex-col items-center cursor-pointer active:scale-95 bg-gray-50 py-3 rounded-2xl border border-gray-100">
                            <AlertTriangle className="w-7 h-7 text-red-500 mb-2"/>
                            <span className="text-[10px] font-bold text-gray-700">{t.reportIssue}</span>
                         </div>
                         <div onClick={() => showToast('មិនទាន់មានព្រឹត្តិការណ៍ទេ')} className="flex flex-col items-center cursor-pointer active:scale-95 bg-gray-50 py-3 rounded-2xl border border-gray-100">
                            <Megaphone className="w-7 h-7 text-green-500 mb-2"/>
                            <span className="text-[10px] font-bold text-gray-700">{t.events}</span>
                         </div>
                         <div onClick={() => showToast('ទាញយកពីមូលដ្ឋានទិន្នន័យ...')} className="flex flex-col items-center cursor-pointer active:scale-95 bg-gray-50 py-3 rounded-2xl border border-gray-100">
                            <Phone className="w-7 h-7 text-blue-500 mb-2"/>
                            <span className="text-[10px] font-bold text-gray-700">{t.emergencyContacts}</span>
                         </div>
                         <div onClick={() => showToast('មុខងារ AI កំពុងអភិវឌ្ឍន៍')} className="flex flex-col items-center cursor-pointer active:scale-95 bg-gray-50 py-3 rounded-2xl border border-gray-100 relative">
                            <MessageSquare className="w-7 h-7 text-purple-500 mb-2"/>
                            <span className="absolute top-2 right-2 bg-purple-600 text-white text-[8px] px-1 rounded font-bold">Beta</span>
                            <span className="text-[10px] font-bold text-gray-700">សំណួរ AI</span>
                         </div>
                      </div>
                   </div>

                   {/* Community News List */}
                   <div className="px-5 pt-4 pb-8 bg-white mt-2 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-black text-[16px] text-gray-900">{t.communityNews}</h3>
                         <span className="text-[12px] text-blue-600 font-bold cursor-pointer">{t.seeAll}</span>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <Megaphone className="w-5 h-5 text-green-600 mr-3 shrink-0 mt-0.5"/>
                            <div className="flex-1">
                               <p className="text-[13px] font-bold text-gray-800 leading-tight mb-1">យុទ្ធនាការអប់រំសុខភាព និងការចាក់វ៉ាក់សាំងនៅសាលាឃុំ</p>
                               <p className="text-[11px] text-gray-500">12 ឧសភា 2026</p>
                            </div>
                         </div>
                         <div className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5"/>
                            <div className="flex-1">
                               <p className="text-[13px] font-bold text-gray-800 leading-tight mb-1">ការព្រមានអាកាសធាតុ៖ អាចមានភ្លៀងធ្លាក់ខ្លាំងនៅល្ងាចនេះ</p>
                               <p className="text-[11px] text-gray-500">11 ឧសភា 2026</p>
                            </div>
                         </div>
                         <div className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <Building2 className="w-5 h-5 text-orange-500 mr-3 shrink-0 mt-0.5"/>
                            <div className="flex-1">
                               <p className="text-[13px] font-bold text-gray-800 leading-tight mb-1">សេចក្តីជូនដំណឹង៖ ការរៀបចំប្រព័ន្ធលូក្នុងសង្កាត់</p>
                               <p className="text-[11px] text-gray-500">10 ឧសភា 2026</p>
                            </div>
                         </div>
                      </div>
                   </div>

                </div>
             )}

             {/* MAP FULLSCREEN TAB */}
             <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'map' ? 'z-30 opacity-100 pointer-events-auto bg-gray-100' : '-z-10 opacity-0 pointer-events-none'}`}>
                
                {/* Search Bar Overlay */}
                <div className="absolute top-12 left-4 right-4 z-40 pointer-events-auto">
                   <div className="bg-white rounded-full shadow-lg flex items-center px-4 py-3.5 border border-gray-100">
                      <button onClick={() => setActiveTab('home')} className="mr-3"><ArrowLeft className="w-5 h-5 text-gray-600"/></button>
                      <input 
                         type="text" value={searchQuery} onChange={handleInputChange} onFocus={() => setShowSuggestions(true)}
                         placeholder={t.searchBox}
                         className="flex-1 bg-transparent outline-none text-[14px] font-medium text-gray-800"
                      />
                      {searchQuery ? <X onClick={clearSearch} className="w-5 h-5 text-gray-400 ml-2 cursor-pointer bg-gray-100 rounded-full p-0.5" /> : <Search className="w-5 h-5 text-gray-400 ml-2"/>}
                      <div className="w-px h-5 bg-gray-200 mx-3"></div>
                      <Settings className="w-5 h-5 text-gray-600 cursor-pointer" onClick={() => setActiveTab('categories')} />
                   </div>
                   {showSuggestions && suggestions.length > 0 && (
                      <div className="mt-2 bg-white rounded-2xl shadow-xl max-h-60 overflow-y-auto border border-gray-100 p-2">
                         {suggestions.map((p, i) => (
                           <div key={i} onClick={() => selectSuggestion(p)} className="px-4 py-3.5 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center border-b border-gray-50 last:border-0">
                              <MapPin className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                              <div className="overflow-hidden">
                                 <p className="font-bold text-sm text-gray-800 truncate">{getPlaceName(p, lang)}</p>
                                 <p className="text-xs text-gray-500 truncate mt-0.5">{p.formattedAddress}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>

                <div id="full-map-container" className="absolute inset-0">
                   {/* Map goes here */}
                </div>
                
                {/* Map Controls */}
                <div className="absolute right-4 top-[100px] flex flex-col gap-3 z-40 pointer-events-auto">
                   <button onClick={toggleMapTheme} className="w-[46px] h-[46px] bg-white rounded-2xl shadow-lg flex items-center justify-center text-gray-700 active:scale-95 border border-gray-100"><Layers className="w-5 h-5"/></button>
                   <button onClick={recenterMap} className="w-[46px] h-[46px] bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600 active:scale-95 border border-gray-100"><Crosshair className="w-5 h-5"/></button>
                </div>

                {/* Nearby Places Bottom Sheet */}
                <div className="absolute bottom-[75px] left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 max-h-[45vh] flex flex-col pb-safe pointer-events-auto">
                   <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3.5 shrink-0"></div>
                   <div className="px-5 pb-3 flex justify-between items-center shrink-0">
                      <h3 className="font-black text-[16px] text-gray-800">{t.nearbyPlaces}</h3>
                      <button onClick={() => setActiveTab('categories')} className="text-blue-600 text-[13px] font-bold">{t.seeAll}</button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
                      {isLoading ? (
                         <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500"/></div>
                      ) : places.length === 0 ? (
                         <p className="text-center text-sm text-gray-400 py-6">{t.noPlaces}</p>
                      ) : (
                         places.slice(0, 15).map((p, i) => {
                            let d = 0; if (userLocation) d = calculateDistance(userLocation.lat, userLocation.lng, p.location.lat(), p.location.lng());
                            const enriched = enrichedData[p.id];
                            let Icon = Building2;
                            let color = 'bg-gray-100 text-gray-500';
                            if (p.types?.includes('school')) { Icon = GraduationCap; color = 'bg-blue-50 text-blue-600'; }
                            if (p.types?.includes('hospital')) { Icon = Activity; color = 'bg-red-50 text-red-600'; }
                            if (p.types?.includes('market')) { Icon = Store; color = 'bg-purple-50 text-purple-600'; }
                            if (p.types?.includes('police')) { Icon = ShieldAlert; color = 'bg-green-50 text-green-600'; }
                            if (enriched) color = 'bg-emerald-50 text-emerald-600';

                            return (
                               <div key={i} onClick={() => { setSelectedPlaceDetail({...p, distance: d.toFixed(1)}); setActiveTab('place_detail'); }} className="flex items-center p-3.5 border border-gray-100 rounded-2xl mb-3 active:bg-gray-50 transition cursor-pointer shadow-sm">
                                  <div className={`w-[46px] h-[46px] rounded-xl ${color} flex items-center justify-center mr-3.5 shrink-0`}>
                                     <Icon className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                     <h4 className="font-bold text-[14px] text-gray-900 truncate mb-1">{getPlaceName(p, lang)}</h4>
                                     <p className="text-[12px] text-gray-500 truncate flex items-center font-medium">
                                        <span className="capitalize">{p.types?.[0]?.replace('_', ' ')}</span> <span className="mx-1.5">•</span> {d > 0 ? `${d.toFixed(1)} km` : 'Near'}
                                     </p>
                                  </div>
                                  <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180" />
                               </div>
                            )
                         })
                      )}
                   </div>
                </div>
             </div>

             {/* CATEGORIES TAB */}
             {activeTab === 'categories' && (
                 <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col pt-10">
                    <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100 shrink-0 shadow-sm relative z-10">
                       <button onClick={() => setActiveTab('home')} className="p-2 active:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
                       <h2 className="flex-1 text-center font-black text-[18px] text-gray-900 pr-10">{t.categoriesTab}</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 pb-[90px] custom-scrollbar">
                       <div className="grid grid-cols-2 gap-4">
                          {MAP_CATEGORIES.map(cat => {
                             const Icon = cat.icon;
                             return (
                             <div key={cat.id} onClick={() => { setSelectedCategory(cat); setActiveTab('map'); }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center justify-center active:scale-95 transition cursor-pointer">
                                <div className={`w-[60px] h-[60px] rounded-2xl ${cat.color} flex items-center justify-center mb-4`}>
                                   <Icon className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-gray-800 text-[14px]">{t[cat.id]}</span>
                             </div>
                          )})}
                       </div>
                    </div>
                 </div>
             )}

             {/* PLACE DETAIL OVERLAY */}
             {activeTab === 'place_detail' && selectedPlaceDetail && (
                 <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end">
                    <div className="flex-1 flex flex-col h-[100dvh] pointer-events-auto bg-gray-50 pb-[75px]">
                       <div className="h-[25vh] bg-gray-200 relative shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent z-10"></div>
                          <button onClick={() => setActiveTab('map')} className="absolute top-12 left-4 z-20 w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white active:scale-95"><ArrowLeft className="w-6 h-6" /></button>
                          <button className="absolute top-12 right-4 z-20 w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white active:scale-95"><Share2 className="w-5 h-5" /></button>
                          
                          <div className="w-full h-full object-cover opacity-90 flex items-center justify-center bg-blue-100">
                             <Building2 className="w-20 h-20 text-blue-200" />
                          </div>
                       </div>

                       <div className="flex-1 bg-white rounded-t-3xl -mt-6 z-20 relative px-6 pt-7 overflow-y-auto custom-scrollbar">
                          <div className="flex items-start justify-between mb-2">
                             <div className="w-[50px] h-[50px] bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 mr-4 shadow-sm border border-blue-100">
                                <MapPin className="w-6 h-6" />
                             </div>
                             <div className="flex-1">
                                <h1 className="text-xl font-black text-gray-900 leading-tight mb-1.5">{getPlaceName(selectedPlaceDetail, lang)}</h1>
                                <p className="text-[13px] font-bold text-gray-500 capitalize">{selectedPlaceDetail.types?.[0]?.replace('_', ' ')}</p>
                             </div>
                          </div>

                          <div className="flex items-center mt-3 mb-6">
                             <div className="flex items-center text-amber-500 text-[13px] font-bold mr-4"><Star className="w-[14px] h-[14px] fill-current mr-1"/> 4.5 <span className="text-gray-400 font-medium ml-1.5">(128)</span></div>
                             <div className="text-[12px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">{selectedPlaceDetail.distance > 0 ? `${selectedPlaceDetail.distance} km` : 'Near'}</div>
                          </div>

                          <div className="flex gap-3 mb-6">
                             <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlaceDetail.location.lat()},${selectedPlaceDetail.location.lng()}`)} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-[16px] flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition text-[14px]">
                                <Navigation className="w-[18px] h-[18px] mr-2" /> {t.directions}
                             </button>
                             {isAdminUser && (
                                 <button onClick={() => { setFormData({...formData, name: getPlaceName(selectedPlaceDetail, lang)}); setShowAddModal(true); }} className="flex-1 border-2 border-blue-600 text-blue-600 font-bold py-3.5 rounded-[16px] flex items-center justify-center active:bg-blue-50 transition text-[14px]">
                                    <Save className="w-[18px] h-[18px] mr-2" /> Report / Add
                                 </button>
                             )}
                          </div>

                          <div className="flex border-b mb-6 border-gray-100">
                             <button className="pb-3 px-4 border-b-[3px] border-blue-600 font-black text-blue-600 text-[13px]">INFO</button>
                             <button className="pb-3 px-4 font-bold text-gray-400 text-[13px]">PHOTOS</button>
                             <button className="pb-3 px-4 font-bold text-gray-400 text-[13px]">REVIEWS</button>
                          </div>

                          <div className="space-y-6 pb-8">
                             <div className="flex items-start">
                                <MapPin className="w-5 h-5 text-gray-400 mr-4 shrink-0 mt-0.5" />
                                <div><p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">{t.addressInfo}</p><p className="text-[13px] text-gray-800 font-medium leading-relaxed">{selectedPlaceDetail.formattedAddress}</p></div>
                             </div>
                             
                             {enrichedData[selectedPlaceDetail.id] ? (
                                <div className="flex items-start bg-emerald-50 p-4 rounded-2xl border border-emerald-100 relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 opacity-10 rounded-bl-full"></div>
                                   <User className="w-5 h-5 text-emerald-600 mr-4 shrink-0 mt-0.5" />
                                   <div className="flex-1 relative z-10">
                                      <p className="text-[11px] font-bold text-emerald-600 mb-1 uppercase tracking-wider">Official Contact</p>
                                      <p className="text-[15px] text-gray-900 font-black">{enrichedData[selectedPlaceDetail.id].customName} <span className="font-semibold text-gray-600 text-sm">({enrichedData[selectedPlaceDetail.id].role})</span></p>
                                      <a href={`tel:${enrichedData[selectedPlaceDetail.id].phone}`} className="text-emerald-700 font-bold text-[17px] block mt-1.5 tracking-wide">{enrichedData[selectedPlaceDetail.id].phone}</a>
                                   </div>
                                   <a href={`tel:${enrichedData[selectedPlaceDetail.id].phone}`} className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 relative z-10"><PhoneCall className="w-5 h-5"/></a>
                                </div>
                             ) : (
                                <div className="flex items-start">
                                   <Phone className="w-5 h-5 text-gray-400 mr-4 shrink-0 mt-0.5" />
                                   <div><p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">{t.phoneInfo}</p><p className="text-[14px] text-gray-800 font-bold">{selectedPlaceDetail.internationalPhoneNumber || t.localDataOnly}</p></div>
                                </div>
                             )}
                             
                             <div className="flex items-start">
                                <Activity className="w-5 h-5 text-gray-400 mr-4 shrink-0 mt-0.5" />
                                <div><p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">{t.hoursInfo}</p><p className="text-[13px] text-gray-800 font-medium">Mon - Fri: 7:00 AM - 5:00 PM</p></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
             )}

             {/* PROFILE / ADMIN TAB */}
             {activeTab === 'profile' && (
                 <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col pt-10 pb-[90px] overflow-y-auto">
                    {!isAdminUser ? (
                       <div className="flex-1 flex flex-col justify-center px-6">
                          <div className="w-full bg-white p-8 rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100">
                             <div className="w-[72px] h-[72px] bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8"/></div>
                             <h2 className="text-[22px] font-black text-center mb-2 text-gray-900">{t.adminLogin}</h2>
                             <p className="text-center text-gray-500 mb-8 text-[13px] px-2">{t.verifyNotice}</p>
                             <form onSubmit={handleAdminLogin} className="space-y-4">
                               <input type="password" placeholder={t.enterPass} className="w-full bg-gray-50 border border-gray-200 px-4 py-4 rounded-2xl focus:border-blue-500 outline-none text-center font-bold tracking-widest text-[15px]" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                               {loginError && <p className="text-red-500 text-sm text-center font-bold">{loginError}</p>}
                               <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition text-[15px]">{t.loginBtn}</button>
                             </form>
                          </div>
                       </div>
                    ) : (
                       <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-gray-100 shrink-0">
                             <h2 className="font-black text-[20px] text-gray-900">{t.adminBtn}</h2>
                             <button onClick={() => { setIsAdminUser(false); setAdminPassword(''); }} className="text-[13px] font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full">{t.logoutBtn}</button>
                          </div>
                          <div className="p-5 space-y-5 custom-scrollbar">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                   <p className="text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{t.addedPlaces}</p>
                                   <p className="text-[32px] font-black text-emerald-600">{Object.keys(enrichedData).length}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                   <p className="text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{t.totalUsers}</p>
                                   <p className="text-[32px] font-black text-blue-600">{visitorLogs.length}</p>
                                </div>
                             </div>

                             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                   <h3 className="font-black text-[15px] text-gray-800">Database (Ramit)</h3>
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                                    {Object.values(enrichedData).length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No data available</p>}
                                    {Object.values(enrichedData).map(data => (
                                       <div key={data.placeId} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                         <div className="overflow-hidden pr-3">
                                            <p className="font-bold text-[14px] text-emerald-800 truncate mb-1">{data.googleName}</p>
                                            <p className="text-[12px] font-bold text-gray-500 truncate">{data.customName} - {data.phone}</p>
                                         </div>
                                         <button onClick={() => deleteEnrichedData(data.placeId)} className="text-red-500 p-3 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition shrink-0"><Trash2 className="w-[18px] h-[18px]"/></button>
                                       </div>
                                    ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
             )}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[75px] bg-white flex justify-between px-5 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-t-[32px]">
              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-14 ${activeTab==='home' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Home className={`w-[24px] h-[24px] ${activeTab==='home' ? 'fill-blue-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1.5">{t.homeTab}</span>
              </button>
              
              <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center justify-center w-14 ${activeTab==='map' || activeTab==='place_detail' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Map className={`w-[24px] h-[24px] ${activeTab==='map' || activeTab==='place_detail' ? 'fill-blue-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1.5">{t.mapTab}</span>
              </button>

              {/* Center Prominent FAB */}
              <div className="relative flex justify-center w-16">
                 <button onClick={() => { setFormData({ name: '', phone: '', type: 'school' }); setShowAddModal(true); }} className="absolute -top-5 w-[56px] h-[56px] bg-blue-600 text-white rounded-[20px] flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.4)] active:scale-95 transition transform border-4 border-white rotate-45 hover:rotate-0 duration-300">
                    <Plus className="w-7 h-7 -rotate-45 hover:rotate-0 transition duration-300" />
                 </button>
                 <span className="absolute bottom-2.5 text-[10px] font-bold text-gray-800">{t.reportTab}</span>
              </div>

              <button onClick={() => {showToast('មុខងារនេះកំពុងរៀបចំ'); setActiveTab('home');}} className={`flex flex-col items-center justify-center w-14 ${activeTab==='news' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <FileText className={`w-[24px] h-[24px] ${activeTab==='news' ? 'fill-blue-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1.5">{t.newsTab}</span>
              </button>

              <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-14 ${activeTab==='profile' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <UserCircle className={`w-[24px] h-[24px] ${activeTab==='profile' ? 'fill-blue-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1.5">{t.profileTab}</span>
              </button>
          </div>

          {/* Add Data Modal (Admin / Report) */}
          {showAddModal && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 z-[80]">
               <div className="bg-white p-7 rounded-[32px] w-full shadow-2xl animate-fade-in border border-gray-100">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                   <h3 className="text-lg font-black text-gray-900 flex items-center"><MapPin className="text-blue-500 mr-2"/> {t.addLocTitle}</h3>
                   <button onClick={() => setShowAddModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-600 active:scale-95"><X className="w-5 h-5"/></button>
                 </div>
                 
                 {!isAdminUser ? (
                    <div className="text-center py-6">
                       <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert className="w-8 h-8 text-orange-500" /></div>
                       <p className="font-black text-[16px] text-gray-800 mb-2">តម្រូវឲ្យមានសិទ្ធិជា Admin</p>
                       <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">សូមចូលគណនី Admin ដើម្បីអាចបន្ថែម ឬកែប្រែទិន្នន័យទីតាំងផ្លូវការបាន។</p>
                       <button onClick={() => { setShowAddModal(false); setActiveTab('profile'); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-[16px] active:scale-95 transition shadow-lg shadow-blue-200">ទៅកាន់ផ្ទាំង Log In</button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div>
                         <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{t.placeNameLabel}</label>
                         <input type="text" placeholder={t.placeHolderName} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-[14px] font-medium" />
                       </div>
                       <div>
                         <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{t.phoneLabel}</label>
                         <input type="tel" placeholder={t.placeholderPhone} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-[14px] font-medium" />
                       </div>
                       <div>
                         <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{t.typeLabel}</label>
                         <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-[14px] font-medium appearance-none">
                           <option value="school">{t.school}</option>
                           <option value="hospital">{t.hospital}</option>
                           <option value="police">{t.police}</option>
                           <option value="government">{t.government}</option>
                         </select>
                       </div>
                       <button onClick={saveEnrichedData} className="w-full bg-blue-600 text-white font-bold py-4 rounded-[16px] mt-6 active:scale-95 transition shadow-lg shadow-blue-200 text-[15px]">{t.saveBtn}</button>
                    </div>
                 )}
               </div>
             </div>
          )}

       </div>
    </div>
  );
}