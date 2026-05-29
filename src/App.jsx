import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, MapPin, Navigation, Building2, Store, GraduationCap, 
  ShieldAlert, Lock, User, Phone, Trash2, Activity, BarChart3, 
  Settings, AlertTriangle, X, Crosshair, Layers, 
  Loader2, Moon, Sun, Globe, PhoneCall, Save, List,
  Home, Compass, Grid, UserCircle, ArrowLeft, Star, Share2, Map
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
    searchBox: "ស្វែងរកទីតាំង...",
    homeTab: "ទំព័រដើម",
    mapTab: "ផែនទី",
    categoriesTab: "ប្រភេទ",
    profileTab: "គណនី",
    exploreMap: "រុករកផែនទី",
    findPlaces: "ស្វែងរកទីតាំង។ ទទួលបានព័ត៌មាន។",
    buildCommunity: "កសាងសហគមន៍កាន់តែប្រសើរ។",
    nearbyPlaces: "ទីតាំងក្បែរអ្នក",
    seeAll: "មើលទាំងអស់",
    school: "សាលារៀន",
    hospital: "មន្ទីរពេទ្យ",
    market: "ផ្សារ",
    government: "ស្ថាប័នរដ្ឋ",
    bank: "ធនាគារ",
    police: "ប៉ុស្តិ៍ប៉ូលីស",
    other: "ផ្សេងៗ",
    directions: "ផ្លូវធ្វើដំណើរ",
    share: "ចែករំលែក",
    addressInfo: "អាសយដ្ឋាន",
    phoneInfo: "លេខទូរស័ព្ទ",
    hoursInfo: "ម៉ោងធ្វើការ",
    myLocation: "ទីតាំងរបស់ខ្ញុំ",
    adminBtn: "ប្រព័ន្ធគ្រប់គ្រង",
    offlineNotice: "អ្នកកំពុងប្រើប្រាស់ក្រៅបណ្តាញ (Offline)",
    noInternet: "គ្មានអ៊ីនធឺណិតទេ",
    adminLogin: "ផ្ទៀងផ្ទាត់សិទ្ធិជា Admin",
    enterPass: "បញ្ចូលលេខសម្ងាត់...",
    loginBtn: "ចូលប្រើប្រាស់",
    saveBtn: "រក្សាទុកទិន្នន័យ",
    placeNameLabel: "ឈ្មោះស្ថាប័ន ឬបុគ្គល",
    phoneLabel: "លេខទូរស័ព្ទទំនាក់ទំនង",
    typeLabel: "ប្រភេទស្ថាប័ន",
    gpsSearching: "កំពុងស្វែងរកទីតាំងរបស់អ្នក...",
    gpsError: "សូមបើក GPS លើទូរស័ព្ទរបស់អ្នក",
    gpsUnsupported: "ទូរស័ព្ទមិនគាំទ្រ GPS ឡើយ",
    totalUsers: "អ្នកប្រើសរុប",
    addedPlaces: "ទីតាំងបានបញ្ចូល",
    localDataOnly: "NO ! មិនទាន់មានទិន្នន័យទំនាក់ទំនង",
    addLocTitle: "រាយការណ៍ / បន្ថែមទិន្នន័យ",
    recenterBtn: "ត្រលប់មកទីតាំងខ្ញុំវិញ",
    analyticTitle: "របាយការណ៍ និងស្ថិតិ",
    notSetLabel: "NO ! លេខ និងតួនាទីមិនទាន់បញ្ជាក់"
  },
  en: {
    appTitle: "Smart Community Map",
    searchBox: "Search location...",
    homeTab: "Home",
    mapTab: "Map",
    categoriesTab: "Categories",
    profileTab: "Profile",
    exploreMap: "Explore Map",
    findPlaces: "Find places. Get information.",
    buildCommunity: "Build a better community.",
    nearbyPlaces: "Nearby Places",
    seeAll: "See all",
    school: "School",
    hospital: "Hospital",
    market: "Market",
    government: "Government",
    bank: "Bank",
    police: "Police",
    other: "Other",
    directions: "Directions",
    share: "Share",
    addressInfo: "Address",
    phoneInfo: "Phone",
    hoursInfo: "Hours",
    myLocation: "Your location",
    adminBtn: "Admin System",
    offlineNotice: "You are offline. Showing saved contacts.",
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
    recenterBtn: "Recenter",
    analyticTitle: "Analytics & Reports",
    notSetLabel: "Unassigned"
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

// Mock Categories
const MAP_CATEGORIES = [
  { id: 'school', icon: GraduationCap, color: 'bg-blue-100 text-blue-600', query: 'school OR university OR primary_school' },
  { id: 'hospital', icon: Activity, color: 'bg-red-100 text-red-600', query: 'hospital OR clinic OR health' },
  { id: 'market', icon: Store, color: 'bg-orange-100 text-orange-600', query: 'market OR supermarket OR mall' },
  { id: 'government', icon: Building2, color: 'bg-green-100 text-green-600', query: 'local_government_office OR city_hall OR commune' },
  { id: 'bank', icon: Building2, color: 'bg-indigo-100 text-indigo-600', query: 'bank OR atm' },
  { id: 'police', icon: ShieldAlert, color: 'bg-blue-100 text-blue-800', query: 'police' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  // App Navigation State (Mobile First Paradigm)
  // 'home' | 'map' | 'categories' | 'profile' (admin) | 'place_detail'
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);

  const isAdminRef = useRef(isAdminUser);
  useEffect(() => { isAdminRef.current = isAdminUser; }, [isAdminUser]);

  const [lang, setLang] = useState('en'); 
  const [isDarkMode, setIsDarkMode] = useState(false); // Fixed missing isDarkMode variable
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
  const infoWindowRef = useRef(null);

  // Google Maps API Key
  const API_KEY = "AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg"; 
  const ADMIN_PASS = "ict168mit";

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message: String(message), type }); // Fixed String cast
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  // FIREBASE INITIALIZATION
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

  // GOOGLE MAPS LOADER
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
      let markerColor = 'bg-blue-500';
      if (place.types?.includes('hospital')) markerColor = 'bg-red-500';
      if (place.types?.includes('market')) markerColor = 'bg-orange-500';
      if (isEnriched) markerColor = 'bg-emerald-600 scale-110';

      markerElement.className = `w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${markerColor}`;
      markerElement.innerHTML = `<div class="w-2 h-2 bg-white rounded-full"></div>`;

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

  // Custom fetch function with larger radius (30km = 30000m)
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
      streetViewControl: true, 
      streetViewControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      fullscreenControl: false,
      zoomControl: false,
      gestureHandling: "greedy" 
    });
    mapRef.current = map;

    map.addListener("click", (e) => {
        if (isAdminRef.current) {
          setPendingLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          setFormData({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
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
                <div class="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                <div class="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-lg"></div>
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
     if (activeTab === 'map' && mapRef.current && userLocation) {
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


  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  const FloatingSearchBar = () => (
    <div className="absolute top-12 left-4 right-4 z-30 pointer-events-auto">
      <div className="bg-white rounded-full shadow-lg flex items-center px-4 py-3 border border-gray-100">
         <Search className="w-5 h-5 text-gray-400 mr-3" />
         <input 
            type="text" value={searchQuery} onChange={handleInputChange} onFocus={() => setShowSuggestions(true)}
            placeholder={t.searchBox}
            className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800"
         />
         {searchQuery && <X onClick={clearSearch} className="w-5 h-5 text-gray-400 ml-2 cursor-pointer hover:text-gray-600" />}
         <div className="w-px h-5 bg-gray-200 mx-3"></div>
         <Settings className="w-5 h-5 text-gray-600 cursor-pointer" onClick={() => setActiveTab('categories')} />
      </div>
      {showSuggestions && suggestions.length > 0 && (
         <div className="mt-2 bg-white rounded-2xl shadow-xl max-h-60 overflow-y-auto border border-gray-100 p-2">
            {suggestions.map((p, i) => (
              <div key={i} onClick={() => selectSuggestion(p)} className="px-3 py-3 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center">
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
  );

  const renderHomeTab = () => (
    <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col items-center pt-16 px-6 overflow-y-auto pb-[90px]">
       <div className="w-full max-w-sm mx-auto flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-8">
             <div className="flex items-center text-emerald-600 font-bold">
                <MapPin className="w-6 h-6 mr-1" />
                <span className="text-lg">Smart Map</span>
             </div>
             <button onClick={() => setLang(lang === 'km' ? 'en' : 'km')} className="bg-white border shadow-sm px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600">
                {lang === 'km' ? 'EN' : 'KH'}
             </button>
          </div>

          <div className="w-full h-48 bg-emerald-100 rounded-3xl mb-8 relative overflow-hidden flex items-center justify-center border-4 border-white shadow-sm">
             <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-emerald-200 opacity-50"></div>
             <Building2 className="w-24 h-24 text-emerald-500 opacity-80" />
             <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                <p className="font-bold text-emerald-800 text-sm">{t.findPlaces}</p>
             </div>
          </div>

          <h2 className="text-xl font-black text-gray-800 text-center mb-2">{t.findPlaces}</h2>
          <p className="text-sm text-gray-500 text-center mb-8">{t.buildCommunity}</p>

          <button onClick={() => setActiveTab('map')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition active:scale-[0.98] mb-10">
             {t.exploreMap}
          </button>

          <div className="w-full flex justify-between px-2">
             {MAP_CATEGORIES.slice(0, 4).map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} onClick={() => { setSelectedCategory(cat); setActiveTab('map'); }} className="flex flex-col items-center cursor-pointer active:scale-95 transition">
                     <div className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center mb-2 shadow-sm border border-white`}>
                        <Icon className="w-6 h-6" />
                     </div>
                     <span className="text-[11px] font-semibold text-gray-600">{t[cat.id]}</span>
                  </div>
               )
             })}
          </div>
       </div>
    </div>
  );

  const renderCategoriesTab = () => (
     <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col pt-12">
        <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100 shrink-0">
           <button onClick={() => setActiveTab('home')} className="p-2 -ml-2"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
           <h2 className="flex-1 text-center font-bold text-lg text-gray-800 pr-8">{t.categoriesTab}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pb-[90px]">
           <div className="grid grid-cols-2 gap-4">
              {MAP_CATEGORIES.map(cat => {
                 const Icon = cat.icon;
                 return (
                 <div key={cat.id} onClick={() => { setSelectedCategory(cat); setActiveTab('map'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center active:scale-95 transition cursor-pointer">
                    <div className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center mb-3`}>
                       <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-gray-700 text-sm">{t[cat.id]}</span>
                 </div>
              )})}
              <div onClick={() => { setSelectedCategory(null); setActiveTab('map'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center active:scale-95 transition cursor-pointer">
                  <div className={`w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mb-3`}>
                     <List className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">{t.other}</span>
               </div>
           </div>
        </div>
     </div>
  );

  const renderPlaceDetailTab = () => {
     if (!selectedPlaceDetail) return null;
     const p = selectedPlaceDetail;
     const enriched = enrichedData[p.id];
     const name = getPlaceName(p, lang);
     
     let customName = enriched?.customName || '';
     let customRole = enriched?.role || '';
     if (lang === 'en' && enriched) {
         customName = translateTextToEn(enriched.customName);
         customRole = translateTextToEn(enriched.role);
     }

     return (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end">
           <div className="flex-1 flex flex-col h-[100dvh] pointer-events-auto bg-gray-50 pb-[70px]">
              <div className="h-64 bg-gray-200 relative shrink-0">
                 <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10"></div>
                 <button onClick={() => setActiveTab('map')} className="absolute top-12 left-4 z-20 w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white"><ArrowLeft className="w-6 h-6" /></button>
                 <button className="absolute top-12 right-4 z-20 w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white"><Share2 className="w-5 h-5" /></button>
                 <div className="w-full h-full object-cover opacity-80 flex items-center justify-center bg-blue-100">
                    <Building2 className="w-32 h-32 text-blue-300" />
                 </div>
              </div>

              <div className="flex-1 bg-white rounded-t-3xl -mt-6 z-20 relative px-6 pt-6 overflow-y-auto custom-scrollbar">
                 <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mr-4">
                       <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                       <h1 className="text-xl font-black text-gray-900 leading-tight mb-1">{name}</h1>
                       <p className="text-sm text-gray-500 capitalize">{p.types?.[0]?.replace('_', ' ')}</p>
                    </div>
                 </div>

                 <div className="flex items-center mt-3 mb-6">
                    <div className="flex items-center text-amber-400 text-sm font-bold mr-4"><Star className="w-4 h-4 fill-current mr-1"/> 4.5 <span className="text-gray-400 font-normal ml-1">(128)</span></div>
                    <div className="text-sm font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.distance > 0 ? `${p.distance} km` : 'Near'}</div>
                 </div>

                 <div className="flex gap-3 mb-8">
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.location.lat()},${p.location.lng()}`)} className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition">
                       <Navigation className="w-5 h-5 mr-2" /> {t.directions}
                    </button>
                    {isAdminUser && (
                        <button onClick={() => { setFormData({...formData, name: name}); setShowAddModal(true); }} className="flex-1 border-2 border-emerald-600 text-emerald-600 font-bold py-3.5 rounded-2xl flex items-center justify-center active:bg-emerald-50 transition">
                           <Save className="w-5 h-5 mr-2" /> Report/Add
                        </button>
                    )}
                 </div>

                 <div className="flex border-b mb-6">
                    <button className="pb-3 px-4 border-b-2 border-emerald-600 font-bold text-emerald-600 text-sm">INFO</button>
                    <button className="pb-3 px-4 font-bold text-gray-400 text-sm">PHOTOS</button>
                    <button className="pb-3 px-4 font-bold text-gray-400 text-sm">REVIEWS</button>
                 </div>

                 <div className="space-y-5 pb-8">
                    <div className="flex items-start">
                       <MapPin className="w-5 h-5 text-gray-400 mr-4 shrink-0 mt-0.5" />
                       <div><p className="text-xs font-bold text-gray-400 mb-0.5">{t.addressInfo}</p><p className="text-sm text-gray-800 font-medium">{p.formattedAddress}</p></div>
                    </div>
                    
                    {enriched ? (
                       <div className="flex items-start bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                          <User className="w-5 h-5 text-emerald-600 mr-4 shrink-0 mt-0.5" />
                          <div className="flex-1">
                             <p className="text-xs font-bold text-emerald-600 mb-0.5">Official Contact ({customRole})</p>
                             <p className="text-base text-gray-900 font-bold">{customName}</p>
                             <a href={`tel:${enriched.phone}`} className="text-emerald-700 font-bold text-lg block mt-1">{enriched.phone}</a>
                          </div>
                          <a href={`tel:${enriched.phone}`} className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white"><PhoneCall className="w-5 h-5"/></a>
                       </div>
                    ) : (
                       <div className="flex items-start">
                          <Phone className="w-5 h-5 text-gray-400 mr-4 shrink-0 mt-0.5" />
                          <div><p className="text-xs font-bold text-gray-400 mb-0.5">{t.phoneInfo}</p><p className="text-sm text-gray-800 font-medium">{p.internationalPhoneNumber || t.localDataOnly}</p></div>
                       </div>
                    )}
                    
                    <div className="flex items-start">
                       <Activity className="w-5 h-5 text-gray-400 mr-4 shrink-0 mt-0.5" />
                       <div><p className="text-xs font-bold text-gray-400 mb-0.5">{t.hoursInfo}</p><p className="text-sm text-gray-800 font-medium">Mon - Fri: 7:00 AM - 5:00 PM</p></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
     )
  };

  const renderProfileTab = () => {
     if (!isAdminUser) {
        return (
           <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col pt-16 px-6">
              <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8"/></div>
                 <h2 className="text-2xl font-black text-center mb-2 text-gray-800">{t.adminLogin}</h2>
                 <p className="text-center text-gray-500 mb-8 text-sm">{t.verifyNotice}</p>
                 <form onSubmit={handleAdminLogin} className="space-y-4">
                   <input type="password" placeholder={t.enterPass} className="w-full bg-gray-50 border-2 border-gray-100 px-4 py-4 rounded-2xl focus:border-blue-500 outline-none text-center font-bold tracking-widest" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                   {loginError && <p className="text-red-500 text-sm text-center font-bold">{loginError}</p>}
                   <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition">{t.loginBtn}</button>
                 </form>
              </div>
           </div>
        )
     }

     return (
        <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col pt-12 pb-[90px] overflow-y-auto">
           <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100">
              <h2 className="font-black text-xl text-gray-800">{t.adminBtn}</h2>
              <button onClick={() => { setIsAdminUser(false); setAdminPassword(''); }} className="text-sm font-bold text-red-500">{t.logoutBtn}</button>
           </div>
           
           <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <p className="text-xs font-bold text-gray-400 mb-1">{t.addedPlaces}</p>
                    <p className="text-3xl font-black text-emerald-600">{Object.keys(enrichedData).length}</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <p className="text-xs font-bold text-gray-400 mb-1">{t.totalUsers}</p>
                    <p className="text-3xl font-black text-blue-600">{visitorLogs.length}</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-4">
                 <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-gray-800">Database (Ramit)</h3>
                 </div>
                 <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                     {Object.values(enrichedData).length === 0 && <p className="text-sm text-gray-400">No data</p>}
                     {Object.values(enrichedData).map(data => (
                        <div key={data.placeId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                          <div className="overflow-hidden pr-2">
                             <p className="font-bold text-[13px] text-emerald-800 truncate">{data.googleName}</p>
                             <p className="text-[11px] font-semibold text-gray-600 truncate">{data.customName} - {data.phone}</p>
                          </div>
                          <button onClick={() => deleteEnrichedData(data.placeId)} className="text-red-500 p-2 bg-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4"/></button>
                        </div>
                     ))}
                 </div>
              </div>
           </div>
        </div>
     )
  }

  // ==========================================
  // MAIN RENDER (Mobile App Container)
  // ==========================================
  return (
    <div className={`flex h-[100dvh] w-full justify-center bg-gray-100 text-gray-800 overflow-hidden relative overscroll-none`}>
       {/* Mobile Constraint Wrapper */}
       <div className="w-full h-full max-w-[480px] bg-white relative shadow-2xl flex flex-col overflow-hidden">
          
          <div className="flex-1 relative w-full h-full">
             
             {/* MAP ALWAYS RENDERED, visibility toggled via CSS */}
             <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'map' || activeTab === 'place_detail' ? 'z-10 opacity-100 pointer-events-auto' : '-z-10 opacity-0 pointer-events-none'}`}>
                {activeTab === 'map' && <FloatingSearchBar />}
                
                <div ref={mapElementRef} className="absolute inset-0" />
                
                {/* Map Controls */}
                {activeTab === 'map' && (
                  <div className="absolute right-4 top-32 flex flex-col gap-3 z-20 pointer-events-auto">
                     <button onClick={toggleMapTheme} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 active:scale-95"><Layers className="w-5 h-5"/></button>
                     <button onClick={recenterMap} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 active:scale-95"><Crosshair className="w-5 h-5"/></button>
                  </div>
                )}

                {/* Nearby Places Bottom Sheet */}
                {activeTab === 'map' && (
                  <div className="absolute bottom-[70px] left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20 max-h-[40vh] flex flex-col pb-safe pointer-events-auto">
                     <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0"></div>
                     <div className="px-5 pb-3 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-800">{t.nearbyPlaces}</h3>
                        <button onClick={() => setActiveTab('categories')} className="text-emerald-600 text-sm font-semibold">{t.seeAll}</button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
                        {isLoading ? (
                           <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-emerald-500"/></div>
                        ) : places.length === 0 ? (
                           <p className="text-center text-sm text-gray-400 py-4">{t.noPlaces}</p>
                        ) : (
                           places.slice(0, 10).map((p, i) => {
                              let d = 0; if (userLocation) d = calculateDistance(userLocation.lat, userLocation.lng, p.location.lat(), p.location.lng());
                              const enriched = enrichedData[p.id];
                              let Icon = Building2;
                              let color = 'bg-gray-100 text-gray-500';
                              if (p.types?.includes('school')) { Icon = GraduationCap; color = 'bg-blue-100 text-blue-600'; }
                              if (p.types?.includes('hospital')) { Icon = Activity; color = 'bg-red-100 text-red-600'; }
                              if (p.types?.includes('market')) { Icon = Store; color = 'bg-orange-100 text-orange-600'; }
                              if (enriched) color = 'bg-emerald-100 text-emerald-600';

                              return (
                                 <div key={i} onClick={() => { setSelectedPlaceDetail({...p, distance: d.toFixed(1)}); setActiveTab('place_detail'); }} className="flex items-center p-3 border-b border-gray-100 last:border-0 active:bg-gray-50 transition cursor-pointer">
                                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mr-3 shrink-0`}>
                                       <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                       <h4 className="font-bold text-sm text-gray-800 truncate">{getPlaceName(p, lang)}</h4>
                                       <p className="text-xs text-gray-500 truncate flex items-center">
                                          {p.types?.[0]?.replace('_', ' ')} • {d > 0 ? `${d.toFixed(1)} km` : ''}
                                       </p>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
                                 </div>
                              )
                           })
                        )}
                     </div>
                  </div>
                )}
             </div>

             {/* OTHER TABS */}
             {activeTab === 'home' && renderHomeTab()}
             {activeTab === 'categories' && renderCategoriesTab()}
             {activeTab === 'profile' && renderProfileTab()}
             {activeTab === 'place_detail' && renderPlaceDetailTab()}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[70px] bg-white border-t border-gray-100 flex z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] pb-safe rounded-t-3xl">
              <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='home' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <Home className={`w-[24px] h-[24px] ${activeTab==='home' ? 'fill-emerald-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1">{t.homeTab}</span>
              </button>
              <button onClick={() => setActiveTab('map')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='map' || activeTab==='place_detail' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <Map className={`w-[24px] h-[24px] ${activeTab==='map' || activeTab==='place_detail' ? 'fill-emerald-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1">{t.mapTab}</span>
              </button>
              <button onClick={() => setActiveTab('categories')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='categories' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <Grid className={`w-[24px] h-[24px] ${activeTab==='categories' ? 'fill-emerald-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1">{t.categoriesTab}</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center justify-center ${activeTab==='profile' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <UserCircle className={`w-[24px] h-[24px] ${activeTab==='profile' ? 'fill-emerald-100' : ''}`} />
                  <span className="text-[10px] font-bold mt-1">{t.profileTab}</span>
              </button>
          </div>

          {/* Add Data Modal (Admin) */}
          {showAddModal && isAdminUser && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
               <div className="bg-white p-6 rounded-3xl w-full shadow-2xl animate-fade-in">
                 <div className="flex justify-between items-center mb-4 border-b pb-3">
                   <h3 className="text-lg font-black flex items-center"><MapPin className="text-emerald-500 mr-2"/> {t.addLocTitle}</h3>
                   <button onClick={() => setShowAddModal(false)} className="bg-gray-100 p-2 rounded-full"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t.placeNameLabel}</label>
                     <input type="text" placeholder={t.placeHolderName} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t.phoneLabel}</label>
                     <input type="tel" placeholder={t.placeholderPhone} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t.typeLabel}</label>
                     <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium">
                       <option value="school">{t.school}</option>
                       <option value="hospital">{t.hospital}</option>
                       <option value="police">{t.police}</option>
                       <option value="government">{t.government}</option>
                     </select>
                   </div>
                   <button onClick={saveEnrichedData} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl mt-4 active:scale-95 transition shadow-lg shadow-emerald-200">{t.saveBtn}</button>
                 </div>
               </div>
             </div>
          )}

          {/* Global Toast */}
          {toast.show && (
            <div className="absolute top-12 left-0 right-0 flex justify-center z-[90] animate-bounce px-4">
              <div className={`px-6 py-3 rounded-full shadow-2xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>{toast.message}</div>
            </div>
          )}

       </div>
    </div>
  );
}