import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Moon, Sun, Search, X, Shield, User, Info, Loader2, 
  Navigation, PhoneCall, Plus, Crosshair, BrainCircuit, 
  AlertTriangle, WifiOff, Trash2, Globe, BarChart3, Lock, Send, UserCircle, Menu, Users, Save
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// 1. Firebase Configuration
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E", 
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "1:1036691345731:web:df8121852c6137e3b35ff6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'smart-map-app-kh';
const appId = rawAppId.split('/')[0]; 

// Math helper for distances
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
};

export default function App() {
  const [map, setMap] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [language, setLanguage] = useState('kh');
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  
  const [firebaseLocations, setFirebaseLocations] = useState([]); 
  const [osmLocations, setOsmLocations] = useState([]); 
  const [isFetchingPois, setIsFetchingPois] = useState(false); 
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');

  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន' });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [adminTab, setAdminTab] = useState('locations');
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'សួស្តី! ខ្ញុំជា SmartMap AI។ តើខ្ញុំអាចជួយរកទីតាំងអ្វីជូនលោកអ្នក?' }]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  // 1. App-like feel (Prevent Pinch-to-Zoom on mobile)
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);

  // Theme
  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); if(map) map.setOptions({styles: darkMapStyle}); } 
    else { document.documentElement.classList.remove('dark'); if(map) map.setOptions({styles: []}); }
  }, [isDarkMode, map]);

  // Auth & Logging
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error(error); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthUser(user);
        if (user && !sessionStorage.getItem('hasLoggedVisit')) {
            try {
              const docId = Date.now().toString() + "-" + Math.floor(Math.random()*1000);
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visitor_stats', docId), { 
                uid: user.uid, timestamp: Date.now(), userAgent: navigator.userAgent 
              });
              sessionStorage.setItem('hasLoggedVisit', 'true');
            } catch(e) {}
        }
    });

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSearchDropdown(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));

    return () => { unsubscribe(); document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  // Fetch Firebase Data (Admin added locations)
  useEffect(() => {
    if (!authUser) return;
    const unsubLoc = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'ramit'), (snapshot) => {
      const locList = [];
      snapshot.forEach(doc => locList.push({ id: doc.id, isAdminData: true, ...doc.data() }));
      setFirebaseLocations(locList);
    });

    let unsubVis, unsubSec;
    if (isAdmin) {
      unsubVis = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'visitor_stats'), (snapshot) => {
         const list = [];
         snapshot.forEach(doc => list.push({id: doc.id, ...doc.data()}));
         setVisitorLogs(list.sort((a,b) => b.timestamp - a.timestamp));
      });
      unsubSec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'security_logs'), (snapshot) => {
         const list = [];
         snapshot.forEach(doc => list.push({id: doc.id, ...doc.data()}));
         setSecurityLogs(list.sort((a,b) => b.timestamp - a.timestamp));
      });
    }

    return () => { unsubLoc(); if(unsubVis) unsubVis(); if(unsubSec) unsubSec(); }
  }, [authUser, isAdmin]);

  // Fetch OSM Data (Auto POIs)
  const fetchNearbyPOIs = async (lat, lng) => {
      if (isOffline) return;
      setIsFetchingPois(true);
      const query = `
        [out:json][timeout:10];
        (
          node["amenity"~"school|hospital|police|fire_station"](around:4000,${lat},${lng});
          node["office"~"government|administrative"](around:4000,${lat},${lng});
          node["place"~"village"](around:4000,${lat},${lng});
        );
        out body;
      `;
      try {
          const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://overpass-api.de/api/interpreter')}`, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}`
          });
          const data = await response.json();
          if (data && data.elements) {
              const formattedPOIs = data.elements.filter(e => e.tags && e.tags.name).map(el => {
                  let type = "ទីតាំងផ្សេងៗ";
                  let am = el.tags.amenity || el.tags.office || el.tags.place;
                  if (am === 'school') type = "សាលារៀន";
                  else if (am === 'hospital') type = "មន្ទីរពេទ្យ / គ្លីនិក";
                  else if (am === 'police') type = "ប៉ុស្តិ៍ប៉ូលីស";
                  else if (['government', 'administrative', 'village'].includes(am)) type = "សាលាឃុំ / ផ្ទះមេភូមិ";
                  return { id: `osm-${el.id}`, name: el.tags.name, type: type, lat: el.lat, lng: el.lon, isAdminData: false };
              });
              setOsmLocations(formattedPOIs);
          }
      } catch (error) { console.warn("POI Fetch Error"); } 
      finally { setIsFetchingPois(false); }
  };

  // Init Map
  useEffect(() => {
    let isMounted = true;
    window.__initGoogleMaps = () => { if (isMounted) initializeMap(); };
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg&libraries=marker&v=beta&callback=__initGoogleMaps`;
      script.async = true;
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) initializeMap();
    return () => { isMounted = false; };
  }, []);

  const initializeMap = async () => {
    if (!mapRef.current || !window.google) return;
    const initialMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 11.5564, lng: 104.9282 }, zoom: 15, mapTypeControl: false, zoomControl: false, streetViewControl: false, gestureHandling: 'greedy', mapId: "450ae928a2c49128",
      styles: isDarkMode ? darkMapStyle : []
    });
    infoWindowRef.current = new window.google.maps.InfoWindow();
    initialMap.addListener("click", () => { if (infoWindowRef.current) infoWindowRef.current.close(); });
    
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos);
          initialMap.panTo(userPos);
          fetchNearbyPOIs(userPos.lat, userPos.lng);

          if (userMarkerRef.current) userMarkerRef.current.position = userPos;
          else {
            const userPin = document.createElement("div");
            userPin.innerHTML = `<div class="relative flex items-center justify-center"><div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div><div class="relative w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div></div>`;
            if (window.google.maps.marker?.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: initialMap, position: userPos, content: userPin });
            }
          }
        },
        () => {}, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    setMap(initialMap);
  };

  // SEARCH LOGIC (Enter Key Support)
  const executeSearch = async (queryToSearch) => {
    if(!queryToSearch.trim()) return;
    setIsSearchingGeocode(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryToSearch)}&limit=5&countrycodes=kh`);
      const results = await response.json();
      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSearchDropdown(true);
      } else {
        showToast("រកមិនឃើញទីតាំងនេះទេ", "error");
        setShowSearchDropdown(false);
      }
    } catch (e) {
        showToast("មានបញ្ហាប្រព័ន្ធស្វែងរក", "error");
    } finally { setIsSearchingGeocode(false); }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Stop form submission behavior
      executeSearch(searchQuery);
    }
  };

  const handleSelectSearchResult = (res) => {
    if (!map) return;
    const loc = { lat: parseFloat(res.lat), lng: parseFloat(res.lon) };
    map.panTo(loc); map.setZoom(16); 
    
    if (tempMarkerRef.current) tempMarkerRef.current.map = null;
    if (window.google.maps.marker?.AdvancedMarkerElement) {
      const searchPin = document.createElement('div');
      searchPin.innerHTML = `<div class="text-4xl animate-bounce">📍</div>`;
      tempMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ position: loc, map: map, content: searchPin });
      setTimeout(() => { if (tempMarkerRef.current) tempMarkerRef.current.map = null; }, 5000);
    }
    fetchNearbyPOIs(loc.lat, loc.lng);
    setShowSearchDropdown(false);
    setSearchQuery(res.display_name.split(',')[0]);
  };

  // MERGE ADMIN DATA WITH OSM DATA
  const allLocationsForMap = useMemo(() => {
    // Keep OSM data ONLY if there is no Admin data near it (radius 100m)
    const filteredOsm = osmLocations.filter(osmLoc => !firebaseLocations.some(fbLoc => calculateDistance(osmLoc.lat, osmLoc.lng, fbLoc.lat, fbLoc.lng) < 0.1));
    return [...firebaseLocations, ...filteredOsm]; // Firebase (Admin) data always takes priority
  }, [firebaseLocations, osmLocations]);

  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;
    markers.forEach(m => { if (m && m.marker) m.marker.map = null; });
    const newMarkers = [];

    allLocationsForMap.forEach(loc => {
      const pinElement = document.createElement('div');
      pinElement.innerHTML = `
        <div class="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
          <div class="${loc.isAdminData ? 'bg-emerald-500 ring-emerald-300' : 'bg-indigo-600 ring-indigo-300'} text-white w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm ring-2 ring-opacity-30">
            ${loc.type === "សាលារៀន" ? `🏫` : loc.type === "មន្ទីរពេទ្យ / គ្លីនិក" ? `🏥` : `📍`}
          </div>
        </div>`;
      const marker = new window.google.maps.marker.AdvancedMarkerElement({ map: map, position: { lat: Number(loc.lat), lng: Number(loc.lng) }, content: pinElement });
      pinElement.addEventListener("click", () => focusLocation(loc, marker));
      newMarkers.push({ id: loc.id, marker });
    });
    setMarkers(newMarkers);
    return () => newMarkers.forEach(m => { if (m.marker) m.marker.map = null; });
  }, [map, allLocationsForMap]);

  const filteredAndSortedLocations = useMemo(() => {
      let mappedLocs = allLocationsForMap.map(loc => {
          let distance = null;
          if (userLocation) distance = calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
          return { ...loc, distance };
      });
      if (activeFilter !== 'ទាំងអស់') mappedLocs = mappedLocs.filter(item => item.type === activeFilter);
      return mappedLocs.sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }, [allLocationsForMap, userLocation, activeFilter]);

  const formatDistance = (dist) => {
      if (dist === null || dist === undefined) return '';
      if (dist < 1) return `${(dist * 1000).toFixed(0)} ម៉ែត្រ`;
      return `${dist.toFixed(1)} គ.ម`;
  };

  const focusLocation = (loc, markerObj = null) => {
    if (!map || !infoWindowRef.current || !window.google) return;
    map.panTo({ lat: loc.lat, lng: loc.lng }); map.setZoom(17);

    let actualMarker = markerObj || markers.find(m => m.id === loc.id)?.marker;
    if (actualMarker) {
      // If it has a phone, show call button
      const callContent = loc.phone 
        ? `<div class="mt-3 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
             <a href="tel:${loc.phone}" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-colors" style="text-decoration:none;">
               <span class="text-lg">📞</span> ចុចខល (${loc.phone})
             </a>
           </div>`
        : `<div class="mt-3 text-center text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900">NO! មិនទាន់មានទិន្នន័យ</div>`;

      const contentString = `
        <div class="p-2 min-w-[220px] font-sans">
            <h3 class="font-extrabold text-gray-900 dark:text-white text-base leading-tight">${loc.isAdminData ? '✅ ' : ''}${loc.name}</h3>
            <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">${loc.type}</p>
            ${loc.distance ? `<p class="text-[10px] text-gray-500 mt-1 font-semibold">📍 ចម្ងាយ៖ ${formatDistance(loc.distance)}</p>` : ''}
            ${callContent}
        </div>
      `;
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open({ anchor: actualMarker, map, shouldFocus: true });
    }
  };

  // Admin Delete
  const handleDeleteLocation = async (locId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', locId));
         showToast("បានលុបទីតាំងជោគជ័យ!", "success");
     } catch (e) { showToast("បរាជ័យក្នុងការលុប", "error"); }
  };

  const saveLocation = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) return showToast("សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទ!", "error");
    const newId = Date.now().toString();
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), { ...formData, lat: pendingLocation.lat, lng: pendingLocation.lng, isAdminData: true });
        setShowAddModal(false); showToast("បានបន្ថែមជោគជ័យ!", "success");
    } catch (e) { showToast("បរាជ័យ", "error"); }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'ict168mit') { 
        setIsAdmin(true); setShowPasswordModal(false); setAdminPassword('');
        showToast('ចូលជា Admin ជោគជ័យ!', 'success');
    } else { showToast('លេខសម្ងាត់មិនត្រឹមត្រូវទេ!', 'error'); }
  }

  // GEMINI AI INTEGRATION
  const handleAiChatSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiTyping(true);

    try {
      const apiKey = ""; // Keep empty, environment handles it
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: userText }] }],
          systemInstruction: { parts: [{ text: "អ្នកគឺជាជំនួយការ AI របស់កម្មវិធី SmartMap Pro។ ត្រូវឆ្លើយតបជាភាសាខ្មែរខ្លីៗ មានប្រយោជន៍។" }] }
        })
      });
      const data = await res.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "សូមអភ័យទោស មានកំហុសបច្ចេកទេស។";
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "មានបញ្ហាភ្ជាប់ទៅកាន់ប្រព័ន្ធ AI។" }]);
    } finally { setIsAiTyping(false); }
  };

  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const recenterMap = () => {
    if (map && userLocation) { map.panTo(userLocation); map.setZoom(16); }
  };

  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "road", stylers: [{ color: "#38414e" }] }
  ];

  return (
    <div className={`flex flex-col h-[100dvh] font-sans overflow-hidden ${isDarkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* HEADER */}
      <header className="h-[60px] flex items-center justify-between px-3 md:px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-30 shrink-0">
        <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">SmartMap</h1>
        
        {/* Search Bar - Hidden on small mobile to put in second row, visible on tablets+ */}
        <div className="hidden sm:flex relative flex-1 max-w-md mx-6" ref={searchContainerRef}>
          <input 
            type="text" placeholder="វាយទីតាំង រួចចុច Enter..." 
            value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          {isSearchingGeocode && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-blue-500 animate-spin" />}
          
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 border dark:border-gray-700 max-h-60 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button key={i} onClick={() => handleSelectSearchResult(res)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-sm truncate">
                  <MapPin className="inline w-3 h-3 mr-2 text-gray-400"/>{res.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAiOpen(!isAiOpen)} className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full hover:scale-105"><BrainCircuit className="w-5 h-5" /></button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:scale-105"><Sun className="w-5 h-5 dark:text-yellow-400 text-gray-500" /></button>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowPasswordModal(true)} className={`p-2 rounded-full text-white hover:scale-105 ${isAdmin ? 'bg-emerald-500' : 'bg-blue-600'}`}>
            {isAdmin ? <Shield className="w-5 h-5"/> : <User className="w-5 h-5"/>}
          </button>
        </div>
      </header>

      {/* MOBILE SEARCH BAR (Only visible on small phones) */}
      <div className="sm:hidden p-2 bg-white dark:bg-gray-900 z-20 shrink-0 border-b dark:border-gray-800 relative">
        <div className="relative">
          <input 
            type="text" placeholder="វាយទីតាំង រួចចុច Go/Enter..." 
            value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          {isSearchingGeocode ? <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-blue-500 animate-spin" /> : (searchQuery && <X onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3.5 top-3 w-4 h-4 text-gray-400 cursor-pointer" />)}
        </div>
        {/* Mobile Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="absolute top-14 left-2 right-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border dark:border-gray-700 max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button key={i} onClick={() => handleSelectSearchResult(res)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-xs truncate">
                <MapPin className="inline w-3 h-3 mr-2 text-gray-400"/>{res.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {/* Mobile: Map Top, List Bottom (flex-col). Desktop: List Left, Map Right (md:flex-row) */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* SIDEBAR (Desktop Left, Mobile Bottom) */}
        <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-gray-900 flex flex-col h-[50%] md:h-full z-10 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-800 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:shadow-none order-2 md:order-1">
          
          {isAdmin ? (
            // Admin Panel
            <div className="flex flex-col h-full overflow-hidden">
               <div className="flex gap-1 p-2 bg-gray-50 dark:bg-gray-800 shrink-0 border-b dark:border-gray-700">
                 <button onClick={()=>setAdminTab('locations')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${adminTab==='locations' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>ទីតាំង</button>
                 <button onClick={()=>setAdminTab('reports')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${adminTab==='reports' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>របាយការណ៍</button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {adminTab === 'locations' && (
                   <>
                     <button onClick={() => {
                       setPendingLocation(userLocation || { lat: 11.5564, lng: 104.9282 });
                       setShowAddModal(true);
                     }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
                       <Plus className="w-5 h-5"/> បន្ថែមទីតាំង (Admin)
                     </button>
                     <p className="text-[10px] text-gray-500 text-center">រាល់ទីតាំងដែល Admin បន្ថែម នឹងត្រូវភ្ជាប់ទៅទីតាំងជាក់ស្តែង (ទិន្នន័យពី OSM) ហើយបង្ហាញលេខទូរស័ព្ទអូតូជូន User ពេលដើរទៅដល់ទីនោះ។</p>
                   </>
                 )}
                 {adminTab === 'reports' && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-900/50">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-50" />
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-bold">អ្នកប្រើប្រាស់សរុប</p>
                      <h2 className="text-4xl font-black text-blue-600 mt-1">{visitorLogs.length}</h2>
                    </div>
                 )}
               </div>
            </div>
          ) : (
            // User Location List
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 shrink-0 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h2 className="font-black text-xs md:text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5"><Navigation className="w-4 h-4 text-blue-600"/> ទីតាំងសំខាន់ៗជុំវិញ</h2>
                {isFetchingPois && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
              </div>
              
              {/* Filters */}
              <div className="p-2 border-b dark:border-gray-800 flex flex-wrap gap-1.5 shrink-0 bg-white dark:bg-gray-900">
                 {['ទាំងអស់', 'សាលារៀន', 'មន្ទីរពេទ្យ / គ្លីនិក', 'ប៉ុស្តិ៍ប៉ូលីស', 'សាលាឃុំ / ផ្ទះមេភូមិ'].map(cat => (
                    <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                       {cat}
                    </button>
                 ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                {filteredAndSortedLocations.length === 0 && !isFetchingPois ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                       <MapPin className="w-8 h-8 mb-3 opacity-30" />
                       <span className="text-xs font-bold text-center">មិនមានទីតាំងជុំវិញទីនេះទេ<br/><span className="text-[10px] font-normal">សាកល្បងដើរទៅមុខទៀត ឬស្វែងរកទីតាំងថ្មី</span></span>
                    </div>
                 ) : filteredAndSortedLocations.map((loc) => (
                    <div key={loc.id} onClick={() => focusLocation(loc)} className={`bg-white dark:bg-gray-800 border p-3 rounded-2xl cursor-pointer hover:border-blue-500 transition-all relative overflow-hidden shadow-sm ${loc.isAdminData ? 'border-l-4 border-emerald-500 border-y-emerald-100 border-r-emerald-100 dark:border-y-gray-700 dark:border-r-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                       {loc.isAdminData && <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500 rounded-bl-xl flex items-start justify-end p-1"><span className="text-white text-[8px] font-black">✔</span></div>}
                       
                       <h4 className="font-extrabold text-xs md:text-sm text-gray-900 dark:text-white leading-tight pr-6">{loc.name}</h4>
                       <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <p className="text-[9px] md:text-[10px] font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">{loc.type}</p>
                          {loc.distance && <p className="text-[9px] md:text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1"><Navigation className="w-2.5 h-2.5"/>{formatDistance(loc.distance)}</p>}
                       </div>

                       {/* Admin Data Logic */}
                       {loc.isAdminData && loc.phone ? (
                          <div className="mt-3">
                             <a href={`tel:${loc.phone}`} onClick={(e)=>e.stopPropagation()} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition-colors">
                               <PhoneCall className="w-3.5 h-3.5"/> 📞 ខលលេខមន្ត្រី / ស្ថាប័ន
                             </a>
                          </div>
                       ) : (
                          <div className="mt-2 text-center text-[9px] md:text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 py-1 rounded border border-rose-100 dark:border-rose-900">NO ! មិនទាន់មានទិន្នន័យ (លេខទូរស័ព្ទ)</div>
                       )}

                       {/* Admin Delete Power */}
                       {isAdmin && loc.isAdminData && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }} className="w-full mt-2 py-1.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg flex justify-center items-center gap-1 hover:bg-rose-200">
                             <Trash2 className="w-3.5 h-3.5" /> លុបទីតាំង
                          </button>
                       )}
                    </div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* MAP CONTAINER (Takes Top Half on Mobile, Right Side on Desktop) */}
        <div className="flex-1 relative z-0 h-[50%] md:h-full order-1 md:order-2">
          <div ref={mapRef} className="w-full h-full bg-gray-200 dark:bg-gray-800" />
          <button onClick={recenterMap} title="ត្រឡប់ទៅទីតាំងខ្ញុំវិញ" className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 w-12 h-12 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform">
            <Crosshair className="w-6 h-6" />
          </button>
        </div>

      </div>

      {/* AI Chat Popup */}
      {isAiOpen && (
        <div className="absolute top-16 right-0 bottom-0 w-full sm:w-[350px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l dark:border-gray-800 animate-in slide-in-from-right duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex justify-between items-center shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-sm"><BrainCircuit className="w-4 h-4"/> SmartMap AI</h3>
            <button onClick={() => setIsAiOpen(false)} className="p-1 bg-white/20 rounded-lg hover:bg-white/30"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm font-medium ${m.role==='user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'}`}>{m.text}</div>
              </div>
            ))}
            {isAiTyping && (
               <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200"></span>
                  </div>
               </div>
            )}
          </div>
          <form onSubmit={handleAiChatSubmit} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
            <input type="text" value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="សួរ AI ជាភាសាខ្មែរ..." className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none text-[13px] border border-transparent focus:border-blue-500 dark:text-white transition-colors" />
            <button type="submit" disabled={!aiInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"><Send className="w-4 h-4"/></button>
          </form>
        </div>
      )}

      {/* Admin Login Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-xs shadow-2xl text-center border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
               <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-black text-lg mb-1 dark:text-white">Admin Access</h3>
            <p className="text-xs text-gray-500 mb-5">បញ្ចូលលេខកូដដើម្បីគ្រប់គ្រងទិន្នន័យ</p>
            <input type="password" placeholder="••••" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleAdminLogin(); }} className="w-full text-center tracking-[0.5em] p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl mb-5 text-xl outline-none border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:text-white transition-colors" autoFocus />
            <div className="flex gap-2">
              <button onClick={()=>setShowPasswordModal(false)} className="flex-1 py-3 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700">បិទ</button>
              <button onClick={handleAdminLogin} className="flex-1 py-3 text-sm bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md">ចូល</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Detail Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-200 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-black text-base dark:text-white flex items-center gap-2">
                <Plus className="text-emerald-500 w-5 h-5" /> បន្ថែមទីតាំងថ្មី
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">ឈ្មោះទីតាំង / ឈ្មោះបុគ្គល</label>
                <input type="text" placeholder="ឧ. មន្ទីរពេទ្យបង្អែក..." value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold border border-gray-200 dark:border-gray-700 outline-none dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">លេខទូរស័ព្ទផ្លូវការ</label>
                <input type="tel" placeholder="012 345 678" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold border border-gray-200 dark:border-gray-700 outline-none dark:text-white font-mono transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">ប្រភេទទីតាំង</label>
                <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold border border-gray-200 dark:border-gray-700 outline-none dark:text-white cursor-pointer transition-colors">
                  <option value="សាលារៀន">សាលារៀន</option>
                  <option value="មន្ទីរពេទ្យ / គ្លីនិក">មន្ទីរពេទ្យ / គ្លីនិក</option>
                  <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                  <option value="សាលាឃុំ / ផ្ទះមេភូមិ">សាលាឃុំ / ផ្ទះមេភូមិ</option>
                </select>
              </div>
            </div>

            <button onClick={saveLocation} className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
              <Save className="w-4 h-4" /> រក្សាទុកទៅកាន់ប្រព័ន្ធ
            </button>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full shadow-lg z-[300] text-[13px] font-bold text-white flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${toast.type==='success' ? 'bg-emerald-500 border border-emerald-600' : 'bg-rose-500 border border-rose-600'}`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}
    </div>
  );
}