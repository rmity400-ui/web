import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Search, X, Shield, User, Info, Loader2, 
  Navigation, PhoneCall, Plus, Crosshair, BrainCircuit, 
  AlertTriangle, WifiOff, Trash2, Globe, BarChart3, Lock, Send, UserCircle, Menu, Users, Save,
  Layers, School, Hospital, ShieldAlert, Building, ArrowLeft, MonitorSmartphone
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// 1. Firebase Configuration (សូមប្រាកដថាអ្នកមាន Config ត្រឹមត្រូវ)
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

// Math helper គណនាចម្ងាយ
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [language, setLanguage] = useState('kh');
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
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
  const isMapCenteredRef = useRef(false);

  // ប្រកាសអថេរស្ថិតិ (Real Data from Firebase)
  const totalUsers = visitorLogs.length;

  // App-like Feel: បិទការ Zoom លើអេក្រង់ Browser (Pinch-to-zoom)
  useEffect(() => {
    document.body.style.touchAction = "pan-x pan-y";
    document.body.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
  }, []);

  // Auth & Analytics Logging (Real Tracking System)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {}
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthUser(user);
        // Track unique user session
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

  // Fetch Firebase Data (ទិន្នន័យពី Admin និង Logs)
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

  // Fetch Auto POIs from OSM (Radius 30KM + រក្សាទុកកន្លែងចាស់រហូត)
  const fetchNearbyPOIs = async (lat, lng) => {
      if (isOffline) return;
      setIsFetchingPois(true);
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"school|hospital|police|fire_station"](around:30000,${lat},${lng});
          node["office"~"government|administrative"](around:30000,${lat},${lng});
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
                  let am = el.tags.amenity || el.tags.office;
                  if (am === 'school') type = "សាលារៀន";
                  else if (am === 'hospital') type = "មន្ទីរពេទ្យ / គ្លីនិក";
                  else if (am === 'police') type = "ប៉ុស្តិ៍ប៉ូលីស";
                  else if (['government', 'administrative'].includes(am)) type = "សាលាឃុំ / ផ្ទះមេភូមិ";
                  return { id: `osm-${el.id}`, name: el.tags.name, type: type, lat: el.lat, lng: el.lon, isAdminData: false };
              });
              
              setOsmLocations(prev => {
                  const newLocs = [...prev];
                  formattedPOIs.forEach(newPoi => {
                      if (!newLocs.some(existing => Math.abs(existing.lat - newPoi.lat) < 0.0001 && Math.abs(existing.lng - newPoi.lng) < 0.0001)) {
                          newLocs.push(newPoi);
                      }
                  });
                  return newLocs;
              });
          }
      } catch (error) { console.warn("POI Fetch Error"); } 
      finally { setIsFetchingPois(false); }
  };

  // Init Google Map
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
      center: { lat: 11.5564, lng: 104.9282 }, zoom: 14, 
      mapTypeControl: false, zoomControl: false, streetViewControl: false, fullscreenControl: false, 
      gestureHandling: 'greedy', mapId: "450ae928a2c49128",
      styles: [] // Light mode only
    });
    infoWindowRef.current = new window.google.maps.InfoWindow();
    initialMap.addListener("click", () => { if (infoWindowRef.current) infoWindowRef.current.close(); });
    
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos);
          
          if (!isMapCenteredRef.current) {
             initialMap.panTo(userPos);
             initialMap.setZoom(16);
             isMapCenteredRef.current = true;
             fetchNearbyPOIs(userPos.lat, userPos.lng);
          }

          if (userMarkerRef.current) userMarkerRef.current.position = userPos;
          else {
            const userPin = document.createElement("div");
            userPin.innerHTML = `<div class="relative flex items-center justify-center"><div class="absolute w-12 h-12 bg-blue-500 rounded-full opacity-30 animate-ping"></div><div class="relative w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-md"></div></div>`;
            if (window.google.maps.marker?.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: initialMap, position: userPos, content: userPin, zIndex: 999 });
            }
          }
        },
        () => {}, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    setMap(initialMap);
  };

  // SEARCH LOGIC: Nominatim 
  const executeSearch = async (queryToSearch) => {
    if(!queryToSearch.trim()) return;
    setIsSearchingGeocode(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryToSearch)}&limit=5&countrycodes=kh`);
      const results = await response.json();
      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSearchDropdown(true);
        handleSelectSearchResult(results[0]); 
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
      e.preventDefault();
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
      searchPin.innerHTML = `<div class="text-5xl animate-bounce drop-shadow-xl pb-2">📍</div>`;
      tempMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ position: loc, map: map, content: searchPin });
      setTimeout(() => { if (tempMarkerRef.current) tempMarkerRef.current.map = null; }, 6000);
    }
    fetchNearbyPOIs(loc.lat, loc.lng);
    setShowSearchDropdown(false);
    setSearchQuery(res.display_name.split(',')[0]);
  };

  // MERGE ADMIN DATA ជាមួយអូតូ (OSM)
  const allLocationsForMap = useMemo(() => {
    const filteredOsm = osmLocations.filter(osmLoc => !firebaseLocations.some(fbLoc => calculateDistance(osmLoc.lat, osmLoc.lng, fbLoc.lat, fbLoc.lng) < 0.1));
    return [...firebaseLocations, ...filteredOsm];
  }, [firebaseLocations, osmLocations]);

  // បង្ហាញសញ្ញាលើផែនទី (Markers)
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;
    markers.forEach(m => { if (m && m.marker) m.marker.map = null; });
    const newMarkers = [];

    allLocationsForMap.forEach(loc => {
      const pinElement = document.createElement('div');
      const pinBg = loc.isAdminData ? 'bg-emerald-500' : 'bg-[#EA4335]'; 
      const iconSvg = loc.type === "សាលារៀន" ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>` 
                    : loc.type === "មន្ទីរពេទ្យ / គ្លីនិក" ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>` 
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

      pinElement.innerHTML = `
        <div class="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center drop-shadow-md">
          <div class="${pinBg} w-[26px] h-[26px] rounded-full border-[1.5px] border-white shadow-md flex items-center justify-center relative z-10">
            ${iconSvg}
          </div>
          <div class="w-1.5 h-1.5 ${pinBg} transform rotate-45 -mt-1 z-0 shadow-sm"></div>
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
    
    setIsSidebarOpen(true);

    let actualMarker = markerObj || markers.find(m => m.id === loc.id)?.marker;
    if (actualMarker) {
      const callContent = loc.phone 
        ? `<div class="mt-2"><a href="tel:${loc.phone}" class="w-full bg-blue-600 text-white py-1.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm" style="text-decoration:none;">📞 ខលទូរស័ព្ទ</a></div>`
        : ``;

      const contentString = `
        <div class="p-1 min-w-[150px] font-sans">
            <h3 class="font-bold text-gray-900 text-sm leading-tight">${loc.isAdminData ? '✅ ' : ''}${loc.name}</h3>
            <p class="text-[10px] text-gray-500 mt-0.5">${loc.type}</p>
            ${callContent}
        </div>
      `;
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open({ anchor: actualMarker, map, shouldFocus: true });
    }
  };

  // ចាប់យក IP
  const getClientIP = async () => {
      try { const res = await fetch('https://api.ipify.org?format=json'); const data = await res.json(); return data.ip; } 
      catch (e) { return 'Unknown IP'; }
  };

  // ចូលជា Admin
  const handleAdminLogin = async () => {
    if (adminPassword === 'ict168mit') { 
        setIsAdmin(true); setShowPasswordModal(false); setAdminPassword('');
        showToast('ចូលជា Admin ជោគជ័យ!', 'success');
        setAdminTab('locations');
        setIsSidebarOpen(true);
    } else { 
        showToast('លេខសម្ងាត់មិនត្រឹមត្រូវទេ!', 'error'); 
        if (authUser) {
            const ip = await getClientIP();
            const secId = Date.now().toString();
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', secId), {
                timestamp: Date.now(), attemptedTime: new Date().toLocaleString(),
                userAgent: navigator.userAgent, ipAddress: ip, lat: userLocation?.lat || 0, lng: userLocation?.lng || 0
            });
        }
    }
  }

  const handleDeleteLocation = async (locId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', locId));
         showToast("បានលុបទីតាំងជោគជ័យ!", "success");
     } catch (e) { showToast("បរាជ័យក្នុងការលុប", "error"); }
  };
  
  const handleDeleteSecurityLog = async (logId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', logId));
         showToast("បានលុបកំណត់ត្រាសុវត្ថិភាព", "success");
     } catch (e) { showToast("បរាជ័យក្នុងការលុប", "error"); }
  };

  const saveLocation = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) return showToast("សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទ!", "error");
    const newId = Date.now().toString();
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), { ...formData, lat: pendingLocation.lat, lng: pendingLocation.lng, isAdminData: true });
        setShowAddModal(false); showToast("បានបន្ថែមទីតាំងជោគជ័យ!", "success");
    } catch (e) { showToast("បរាជ័យ", "error"); }
  };

  const handleInitiateAddDetail = () => {
    if (navigator.geolocation) {
      showToast("កំពុងចាប់យកទីតាំងឈររបស់អ្នក...", "success");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setPendingLocation(newPos);
          setFormData({ name: '', phone: '', type: 'សាលារៀន' });
          setShowAddModal(true);
          if(map) { map.panTo(newPos); map.setZoom(18); }
        },
        (error) => { showToast("សូមបើក GPS ទូរស័ព្ទ!", "error"); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // GEMINI AI INTEGRATION (FIXED)
  const handleAiChatSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiTyping(true);

    try {
      const apiKey = ""; // API Key provided by server
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: userText }] }],
          systemInstruction: { parts: [{ text: "អ្នកគឺជាជំនួយការ AI របស់កម្មវិធី SmartMap Pro។ ត្រូវឆ្លើយតបជាភាសាខ្មែរខ្លីៗ។" }] }
        })
      });
      const data = await res.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "សូមអភ័យទោស មានកំហុសបច្ចេកទេស។";
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "មានបញ្ហាភ្ជាប់ទៅកាន់ប្រព័ន្ធ AI។ សូមសាកល្បងម្ដងទៀត។" }]);
    } finally { setIsAiTyping(false); }
  };

  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const recenterMap = () => {
    if (map && userLocation) { map.panTo(userLocation); map.setZoom(16); }
  };

  // Chart calculation for actual real data tracking
  const getWeeklyStats = () => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      visitorLogs.forEach(log => {
          const logDate = new Date(log.timestamp);
          const diffDays = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
          if(diffDays < 7) {
              const dayIndex = logDate.getDay(); // 0 is Sunday, 6 is Saturday
              counts[dayIndex]++;
          }
      });
      return counts;
  };
  const weeklyStats = getWeeklyStats();
  const maxWeeklyStat = Math.max(...weeklyStats, 1);

  return (
    <div className="relative w-full h-[100dvh] font-sans overflow-hidden bg-white text-gray-900">
      
      {/* 1. MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div ref={mapRef} className="w-full h-full bg-gray-100" />
      </div>

      {/* 2. FLOATING SEARCH BAR (Top Left) */}
      <div className="absolute top-4 left-4 right-16 md:right-auto md:w-[400px] z-20" ref={searchContainerRef}>
        <div className="bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center px-4 py-2.5 border border-transparent">
          <Menu onClick={() => setIsSidebarOpen(true)} className="w-6 h-6 text-gray-700 mr-3 cursor-pointer" />
          <input 
            type="text" placeholder="ស្វែងរកក្នុង SmartMap..." 
            value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-gray-900 placeholder-gray-500"
          />
          {isSearchingGeocode ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin ml-2" /> : 
             searchQuery ? <X onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }} className="w-5 h-5 text-gray-500 cursor-pointer ml-2" /> :
             <Search onClick={() => executeSearch(searchQuery)} className="w-5 h-5 text-gray-500 cursor-pointer ml-2" />
          }

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-[52px] left-0 right-0 bg-white rounded-2xl shadow-xl border max-h-[60vh] overflow-y-auto z-50 py-2">
              {searchResults.map((res, i) => (
                <button key={i} onClick={() => handleSelectSearchResult(res)} className="w-full text-left px-5 py-3 hover:bg-gray-100 border-b border-gray-100 text-sm flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0"/>
                  <span className="truncate">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar pointer-events-auto w-[100vw] md:w-full -ml-4 pl-4 pr-4 md:ml-0 md:pl-0 md:pr-0">
          {[
            { id: 'ទាំងអស់', icon: MapPin },
            { id: 'សាលារៀន', icon: School },
            { id: 'មន្ទីរពេទ្យ / គ្លីនិក', icon: Hospital },
            { id: 'ប៉ុស្តិ៍ប៉ូលីស', icon: ShieldAlert },
            { id: 'សាលាឃុំ / ផ្ទះមេភូមិ', icon: Building }
          ].map(cat => (
             <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`flex items-center shrink-0 gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-colors border ${activeFilter === cat.id ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-transparent'}`}>
                <cat.icon className="w-4 h-4" /> {cat.id}
             </button>
          ))}
        </div>
      </div>

      {/* 3. RIGHT SIDE CONTROLS */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        {/* Profile */}
        <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={`w-[42px] h-[42px] bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] flex items-center justify-center border-[2px] transition-all ${isAdmin ? 'border-emerald-500' : 'border-transparent'}`}>
                {isAdmin ? <Shield className="w-5 h-5 text-emerald-600" /> : <UserCircle className="w-6 h-6 text-gray-600" />}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border py-2 origin-top-right">
                <div className="px-4 py-2 border-b">
                  <p className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                    {isAdmin ? '🛡️ Admin Account' : '👤 Guest User'}
                  </p>
                </div>
                {!isAdmin ? (
                  <button onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 text-blue-600 font-bold flex items-center gap-3">
                    <Lock className="w-4 h-4" /> ចូលជា Admin
                  </button>
                ) : (
                  <button onClick={() => { setIsAdmin(false); setShowProfileMenu(false); setAdminTab('locations'); }} className="w-full text-left px-4 py-3 text-sm hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-3">
                    <Trash2 className="w-4 h-4" /> ចាកចេញពី Admin
                  </button>
                )}
              </div>
            )}
        </div>
        {/* AI Button */}
        <button onClick={() => setIsAiOpen(true)} className="w-[42px] h-[42px] bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] flex items-center justify-center hover:bg-gray-50 transition-colors">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
        </button>
      </div>

      <div className="absolute bottom-8 right-4 z-20 flex flex-col gap-3">
        <button onClick={() => map && map.setMapTypeId(map.getMapTypeId() === 'roadmap' ? 'hybrid' : 'roadmap')} className="w-10 h-10 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)] flex items-center justify-center hover:bg-gray-50 text-gray-700">
            <Layers className="w-5 h-5" />
        </button>
        <button onClick={recenterMap} className="w-10 h-10 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)] flex items-center justify-center hover:bg-gray-50 text-blue-600">
            <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* 4. LEFT SIDEBAR (Slide-in Drawer) */}
      <div className={`fixed top-0 left-0 h-full w-[85%] md:w-[380px] bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b flex justify-between items-center bg-white shrink-0">
          <h2 className="font-bold text-[15px] flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            {isAdmin ? "Admin Dashboard" : "បញ្ជីទីតាំងជុំវិញ"}
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
             <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {isAdmin ? (
          // ADMIN CONTENT
          <div className="flex flex-col h-full overflow-hidden">
             <div className="flex border-b shrink-0 px-2 pt-2 bg-gray-50">
               <button onClick={()=>setAdminTab('locations')} className={`flex-1 py-2.5 text-[13px] font-bold ${adminTab==='locations' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500'}`}>ទីតាំង</button>
               <button onClick={()=>setAdminTab('reports')} className={`flex-1 py-2.5 text-[13px] font-bold ${adminTab==='reports' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500'}`}>របាយការណ៍</button>
               <button onClick={()=>setAdminTab('security')} className={`flex-1 py-2.5 text-[13px] font-bold ${adminTab==='security' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500'}`}>សុវត្ថិភាព</button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
               {adminTab === 'locations' && (
                 <>
                   <button onClick={handleInitiateAddDetail} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm mb-4 transition-transform active:scale-95">
                     <Plus className="w-5 h-5"/> បន្ថែមទីតាំង (ត្រង់កន្លែងឈរ)
                   </button>
                   <div className="space-y-3">
                     {firebaseLocations.map(loc => (
                       <div key={loc.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50 flex justify-between items-center">
                         <div>
                           <p className="font-bold text-[13px] text-gray-900">{loc.name}</p>
                           <p className="text-[11px] text-gray-500 font-mono mt-0.5">{loc.phone}</p>
                         </div>
                         <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </>
               )}
               {adminTab === 'reports' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-5 rounded-2xl text-center border border-blue-100">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
                      <p className="text-gray-600 text-xs font-bold">អ្នកប្រើប្រាស់សរុប (All Time)</p>
                      <h2 className="text-4xl font-black text-blue-600 mt-1">{totalUsers}</h2>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <h3 className="font-bold text-sm mb-4">ស្ថិតិសប្តាហ៍នេះ</h3>
                        <div className="flex items-end justify-between h-24 gap-2">
                            {weeklyStats.map((count, i) => (
                                <div key={i} className="flex flex-col items-center flex-1 gap-1.5">
                                    <div className="w-full bg-blue-100 rounded-t-sm relative flex items-end h-full">
                                        <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${(count / maxWeeklyStat) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-500">{['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                         <div className="bg-gray-100 p-2 rounded-lg"><p className="font-bold text-gray-500">ខែនេះ</p><p className="font-black text-lg text-emerald-600">{visitorLogs.filter(log => (Date.now() - log.timestamp) < 86400000*30).length}</p></div>
                         <div className="bg-gray-100 p-2 rounded-lg"><p className="font-bold text-gray-500">ឆ្នាំនេះ</p><p className="font-black text-lg text-amber-600">{visitorLogs.filter(log => (Date.now() - log.timestamp) < 86400000*365).length}</p></div>
                    </div>
                  </div>
               )}
               {adminTab === 'security' && (
                  <div className="space-y-3">
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2 text-rose-600">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-bold">មានការប៉ុនប៉ងលួចចូល {securityLogs.length} ដង</p>
                    </div>
                    {securityLogs.map(log => (
                      <div key={log.id} className="bg-white border p-3 rounded-xl shadow-sm relative">
                        <p className="text-xs font-black text-gray-800 mb-1">{log.attemptedTime}</p>
                        <p className="text-[10px] text-gray-500 mb-1 font-mono">IP: {log.ipAddress}</p>
                        <p className="text-[10px] text-gray-500 truncate"><MonitorSmartphone className="inline w-3 h-3 mr-1"/>{log.userAgent}</p>
                        <button onClick={() => handleDeleteSecurityLog(log.id)} className="absolute top-2 right-2 p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
               )}
             </div>
          </div>
        ) : (
          // USER CONTENT (List)
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-gray-50">
             {isFetchingPois && <div className="text-center py-6 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>}
             {filteredAndSortedLocations.map((loc) => (
                <div key={loc.id} onClick={() => { focusLocation(loc); setIsSidebarOpen(false); }} className="bg-white rounded-2xl mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 overflow-hidden">
                   <div className="p-3.5 flex gap-3 items-start">
                      <div className={`flex-shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center text-white shadow-sm ${loc.isAdminData ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                        {loc.type === "សាលារៀន" ? <School className="w-4 h-4"/> : loc.type === "មន្ទីរពេទ្យ / គ្លីនិក" ? <Hospital className="w-4 h-4"/> : <MapPin className="w-4 h-4"/>}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-[14px] leading-tight">{loc.isAdminData ? '✅ ' : ''}{loc.name}</h4>
                        <div className="flex gap-2 mt-1.5 items-center flex-wrap">
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{loc.type}</span>
                          {loc.distance && <span className="text-[10px] text-gray-400 font-medium">• {formatDistance(loc.distance)}</span>}
                        </div>
                        {loc.isAdminData && loc.phone && (
                          <div className="mt-3">
                             <a href={`tel:${loc.phone}`} onClick={(e)=>e.stopPropagation()} className="w-max bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition-colors">
                               <PhoneCall className="w-3 h-3"/> ខលសាកសួរ
                             </a>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* 5. AI CHAT DRAWER */}
      <div className={`fixed top-0 right-0 h-full w-[85%] md:w-[380px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isAiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shrink-0">
          <h2 className="font-bold flex items-center gap-2"><BrainCircuit className="w-5 h-5"/> SmartMap AI</h2>
          <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
           {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm ${m.role==='user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 rounded-tl-sm'}`}>{m.text}</div>
              </div>
           ))}
           {isAiTyping && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
        </div>
        <form onSubmit={handleAiChatSubmit} className="p-3 bg-white border-t flex gap-2">
          <input type="text" value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="សួរជាភាសាខ្មែរមកកាន់ AI..." className="flex-1 px-4 py-3 rounded-full bg-gray-100 outline-none text-sm" />
          <button type="submit" disabled={!aiInput.trim()} className="bg-indigo-600 text-white w-11 h-11 rounded-full flex items-center justify-center shrink-0"><Send className="w-4 h-4 ml-1"/></button>
        </form>
      </div>

      {/* 6. MODALS */}
      {/* Admin Login Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-black text-xl mb-6">បញ្ចូលលេខកូដ Admin</h3>
            <input type="password" placeholder="•••••••••" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleAdminLogin(); }} className="w-full text-center tracking-[0.5em] p-4 bg-gray-100 rounded-2xl mb-6 text-xl outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
            <div className="flex gap-3">
              <button onClick={()=>setShowPasswordModal(false)} className="flex-1 py-3.5 bg-gray-200 text-gray-700 rounded-xl font-bold">បោះបង់</button>
              <button onClick={handleAdminLogin} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold">ចូលប្រព័ន្ធ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="text-emerald-500 w-5 h-5" /> បន្ថែមទីតាំង (ត្រង់ចំណុចឈរ)</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="ឈ្មោះស្ថាប័ន / បុគ្គល..." value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="tel" placeholder="លេខទូរស័ព្ទផ្លូវការ..." value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
              <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="សាលារៀន">សាលារៀន</option>
                <option value="មន្ទីរពេទ្យ / គ្លីនិក">មន្ទីរពេទ្យ / គ្លីនិក</option>
                <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                <option value="សាលាឃុំ / ផ្ទះមេភូមិ">សាលាឃុំ / ផ្ទះមេភូមិ</option>
              </select>
            </div>
            <button onClick={saveLocation} className="w-full mt-6 bg-emerald-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Save className="w-5 h-5"/> រក្សាទុក
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-8 md:top-6 md:bottom-auto left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-[200] text-[13px] font-bold text-white flex items-center gap-2 ${toast.type==='success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}