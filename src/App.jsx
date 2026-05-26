import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Moon, Sun, Search, X, Shield, User, Info, Loader2, 
  Navigation, PhoneCall, Plus, Menu, Crosshair, BrainCircuit, 
  Users, AlertTriangle, WifiOff, Trash2, Globe, BarChart3, Lock,
  Send, UserCircle, List, ChevronUp, ChevronDown, Layers
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

// Distance Calculator
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

// Fallback POIs (For safety if OSM is slow)
const getFallbackPOIs = (lat, lng) => {
  return [
    { id: "fallback-1", name: "សាលាបឋមសិក្សា / វិទ្យាល័យ (គំរូ)", type: "សាលារៀន", lat: lat + 0.003, lng: lng - 0.002, isAdminData: false, keywords: ["សាលារៀន", "school"] },
    { id: "fallback-2", name: "មណ្ឌលសុខភាព (គំរូ)", type: "មន្ទីរពេទ្យ / គ្លីនិក", lat: lat + 0.005, lng: lng + 0.002, isAdminData: false, keywords: ["មន្ទីរពេទ្យ", "hospital", "គ្លីនិក"] }
  ];
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [firebaseLocations, setFirebaseLocations] = useState([]); 
  const [osmLocations, setOsmLocations] = useState([]); 
  const [isFetchingPois, setIsFetchingPois] = useState(false); 
  const [activeFilter, setActiveFilter] = useState('ទាំងអស់');
  const [isSatellite, setIsSatellite] = useState(false);

  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន' });
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Admin Dashboard States
  const [adminTab, setAdminTab] = useState('locations');
  const [statPeriod, setStatPeriod] = useState('week'); // week, month, year
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);

  // Offline Contacts
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineContacts, setOfflineContacts] = useState([]);

  // AI Chat
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'សួស្តី! ខ្ញុំជា SmartMap AI។ តើលោកអ្នកចង់ដឹងព័ត៌មានពីទីតាំងណាមួយទេ?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const isMapCenteredRef = useRef(false);
  const watchIdRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchContainerMobileRef = useRef(null);
  const profileMenuRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);

  // Real-time Stats Calculations
  const totalUsers = visitorLogs.length;
  const activeUsers = useMemo(() => {
    const now = Date.now();
    return visitorLogs.filter(log => (now - Number(log.timestamp)) < 86400000).length;
  }, [visitorLogs]);

  // Handle Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOfflineContacts(JSON.parse(localStorage.getItem('smartmap_offline_contacts') || '[]'));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveContactForOffline = (loc) => {
    if (!loc.phone) return;
    const existing = JSON.parse(localStorage.getItem('smartmap_offline_contacts') || '[]');
    const updated = [{ name: loc.name, phone: loc.phone, type: loc.type }, ...existing.filter(c => c.phone !== loc.phone)].slice(0, 10);
    setOfflineContacts(updated);
    localStorage.setItem('smartmap_offline_contacts', JSON.stringify(updated));
  };

  const handleCall = (loc) => {
    saveContactForOffline(loc);
    window.location.href = `tel:${loc.phone}`;
  };

  // Set Theme
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Auth & Analytics Logging
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (e) { await signInAnonymously(auth); }
        } else { await signInAnonymously(auth); }
      } catch (error) {}
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target) &&
          searchContainerMobileRef.current && !searchContainerMobileRef.current.contains(e.target)) {
          setShowSearchDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch Firebase Location Data
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

    return () => { 
      unsubLoc(); 
      if (unsubVis) unsubVis(); 
      if (unsubSec) unsubSec(); 
    }
  }, [authUser, isAdmin]);

  // Fetch POIs from OpenStreetMap
  const fetchNearbyPOIs = async (lat, lng) => {
      if (isOffline) return;
      setIsFetchingPois(true);
      const query = `
        [out:json][timeout:10];
        (
          node["amenity"~"school|hospital|police|fire_station"](around:4000,${lat},${lng});
          node["office"~"government|administrative"](around:4000,${lat},${lng});
        );
        out body;
      `;
      try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://overpass-api.de/api/interpreter')}`;
          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`
          });
          
          if (!response.ok) throw new Error('Network error');
          const data = await response.json();
          
          if (data && data.elements && data.elements.length > 0) {
              const formattedPOIs = data.elements.filter(e => e.tags && e.tags.name).map(el => {
                  let type = "ទីតាំងផ្សេងៗ";
                  let amenity = el.tags.amenity || el.tags.office || el.tags.place;
                  if (amenity === 'school') type = "សាលារៀន";
                  else if (amenity === 'hospital') type = "មន្ទីរពេទ្យ / គ្លីនិក";
                  else if (amenity === 'police') type = "ប៉ុស្តិ៍ប៉ូលីស";
                  else if (['government', 'administrative'].includes(amenity)) type = "សាលាឃុំ / ផ្ទះមេភូមិ";

                  return {
                      id: `osm-${el.id}`, name: el.tags.name, type: type,
                      lat: el.lat, lng: el.lon, isAdminData: false, keywords: [el.tags.name, type] 
                  };
              });
              setOsmLocations(formattedPOIs);
          } else { setOsmLocations(getFallbackPOIs(lat, lng)); }
      } catch (error) { 
          setOsmLocations(getFallbackPOIs(lat, lng));
      } finally { setIsFetchingPois(false); }
  };

  // Google Maps Initialization (With proper API Key configuration)
  useEffect(() => {
    let isMounted = true;
    window.__initGoogleMaps = () => { if (isMounted) initializeMap(); };

    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg&libraries=places,marker&v=beta&loading=async&callback=__initGoogleMaps`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
      initializeMap();
    }

    return () => {
        isMounted = false;
        if (watchIdRef.current && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const initializeMap = async () => {
    if (!mapRef.current || !window.google || typeof window.google.maps.Map !== 'function') return;
    try { await window.google.maps.importLibrary("marker"); } catch (e) {}

    const initialCenter = { lat: 11.5564, lng: 104.9282 }; // Default PP
    const initialMap = new window.google.maps.Map(mapRef.current, {
      center: initialCenter, 
      zoom: 15, 
      mapTypeId: 'roadmap',
      mapTypeControl: false, 
      zoomControl: false,
      streetViewControl: false,
      gestureHandling: 'greedy', 
      mapId: "450ae928a2c49128",
      styles: isDarkMode ? [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { elementType: "road", stylers: [{ color: "#38414e" }] }
      ] : []
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
    initialMap.addListener("click", () => { if (infoWindowRef.current) infoWindowRef.current.close(); });

    // Initialize Places Services for Search
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    placesServiceRef.current = new window.google.maps.places.PlacesService(initialMap);

    // Live Tracking
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos);

          if (!isMapCenteredRef.current && initialMap) {
            initialMap.setCenter(userPos);
            initialMap.setZoom(16);
            isMapCenteredRef.current = true;
            fetchNearbyPOIs(userPos.lat, userPos.lng);
          }

          if (userMarkerRef.current) {
            userMarkerRef.current.position = userPos;
          } else {
            const userPin = document.createElement("div");
            userPin.innerHTML = `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                <div class="relative w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
              </div>`;
            if (window.google.maps.marker?.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
                map: initialMap, position: userPos, content: userPin, title: "ទីតាំងរបស់អ្នក" 
              });
            }
          }
        },
        (error) => { 
            console.warn("GPS Tracking limited:", error.message);
            if (!isMapCenteredRef.current) {
               fetchNearbyPOIs(initialCenter.lat, initialCenter.lng);
               isMapCenteredRef.current = true;
            }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    setMap(initialMap);
  };

  // Map Type Toggle (Satellite vs Roadmap)
  const toggleMapType = () => {
    if (map) {
      const newType = isSatellite ? 'roadmap' : 'hybrid'; // hybrid gives satellite + labels
      map.setMapTypeId(newType);
      setIsSatellite(!isSatellite);
    }
  };

  // Google Maps FAST Unified Search (Works perfectly for KH)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim() || !autocompleteServiceRef.current) { 
      setSearchResults([]); setShowSearchDropdown(false); return; 
    }

    autocompleteServiceRef.current.getPlacePredictions({ 
      input: val, 
      componentRestrictions: { country: 'kh' }, // Restrict to Cambodia
      language: 'km' // Request Khmer language results
    }, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSearchResults(predictions);
        setShowSearchDropdown(true);
      } else {
        setSearchResults([]);
      }
    });
  };

  const handleSelectSearchResult = (prediction) => {
    if (!map || !placesServiceRef.current) return;
    
    placesServiceRef.current.getDetails({ placeId: prediction.place_id, fields: ['geometry', 'name'] }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry && place.geometry.location) {
            const loc = place.geometry.location;
            if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
            else { map.panTo(loc); map.setZoom(16); }

            if (tempMarkerRef.current) tempMarkerRef.current.map = null;
            if (window.google.maps.marker?.AdvancedMarkerElement) {
              const searchPin = document.createElement('div');
              searchPin.innerHTML = `<div class="relative transform -translate-y-4 animate-bounce"><div class="text-4xl filter drop-shadow-md">📍</div></div>`;
              tempMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ position: loc, map: map, content: searchPin, title: place.name });
            }

            fetchNearbyPOIs(loc.lat(), loc.lng());
            setSearchQuery(place.name || prediction.description.split(',')[0]);
            setShowSearchDropdown(false);
            if(window.innerWidth < 768) setIsSidebarOpen(false);
        }
    });
  };

  // Merge Data
  const allLocationsForMap = useMemo(() => {
    if (!firebaseLocations || !osmLocations) return [];
    const filteredOsm = osmLocations.filter(osmLoc => {
        return !firebaseLocations.some(fbLoc => calculateDistance(osmLoc.lat, osmLoc.lng, fbLoc.lat, fbLoc.lng) < 0.1);
    });
    return [...firebaseLocations, ...filteredOsm];
  }, [firebaseLocations, osmLocations]);

  // Update Markers
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    markers.forEach(m => { if (m && m.marker) m.marker.map = null; });
    const newMarkers = [];

    allLocationsForMap.forEach(loc => {
      const pinElement = document.createElement('div');
      pinElement.className = "cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-50";
      
      const pinBg = loc.isAdminData ? 'bg-emerald-500 ring-emerald-300' : 'bg-indigo-600 ring-indigo-300';
      const iconSvg = loc.type === "សាលារៀន" 
        ? `🏫` : loc.type === "មន្ទីរពេទ្យ / គ្លីនិក" ? `🏥` : `📍`;

      pinElement.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="${pinBg} text-white w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm ring-2 ring-opacity-30">
            ${iconSvg}
          </div>
          <div class="w-1.5 h-1.5 ${loc.isAdminData ? 'bg-emerald-500' : 'bg-indigo-600'} rounded-full mt-1 shadow-sm"></div>
        </div>`;

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: map, position: { lat: Number(loc.lat), lng: Number(loc.lng) }, content: pinElement
      });

      pinElement.addEventListener("click", () => focusLocation(loc, marker));
      newMarkers.push({ id: loc.id, marker });
    });

    setMarkers(newMarkers);
    return () => newMarkers.forEach(m => { if (m.marker) m.marker.map = null; });
  }, [map, allLocationsForMap]);

  // Sidebar / Bottom Sheet Filtering
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
    map.panTo({ lat: loc.lat, lng: loc.lng }); 
    if(window.innerWidth < 768) setIsSidebarOpen(false); 

    let actualMarker = markerObj || markers.find(m => m.id === loc.id)?.marker;

    if (actualMarker) {
      const btnId = `call-btn-${loc.id}`;
      const callContent = loc.phone 
        ? `<button id="${btnId}" class="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-colors"><span class="text-lg">📞</span> ចុចខល (${loc.phone})</button>`
        : `<div class="mt-3 text-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 py-2 rounded-xl">មិនមានលេខទូរស័ព្ទ</div>`;

      const contentString = `
        <div class="p-2 min-w-[220px] font-sans">
            <h3 class="font-extrabold text-gray-900 dark:text-white text-base leading-tight">${loc.isAdminData ? '✅' : ''} ${loc.name}</h3>
            <p class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">${loc.type}</p>
            ${loc.distance ? `<p class="text-xs text-gray-500 mt-1">📍 ចម្ងាយ៖ ${formatDistance(loc.distance)}</p>` : ''}
            ${callContent}
        </div>
      `;
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open({ anchor: actualMarker, map, shouldFocus: true });

      if (loc.phone) {
        window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
            const btn = document.getElementById(btnId);
            if (btn) btn.addEventListener('click', () => handleCall(loc));
        });
      }
    }
  };

  const handleInitiateAddDetail = () => {
    setIsAutoLocating(true);
    if (navigator.geolocation) {
      showToast("កំពុងទាញទីតាំងអ្នក...", "success");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setPendingLocation(newPos);
          setFormData({ name: '', phone: '', type: 'សាលារៀន' });
          setIsAutoLocating(false); setShowAddModal(true);
          if(map) { map.panTo(newPos); map.setZoom(17); }
        },
        (error) => { 
          setIsAutoLocating(false); 
          setPendingLocation(userLocation || { lat: 11.5564, lng: 104.9282 });
          setShowAddModal(true);
        }, { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const saveLocation = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) return showToast("សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទ!", "error");
    
    const newId = Date.now().toString();
    const newLoc = { ...formData, lat: pendingLocation.lat, lng: pendingLocation.lng, isAdminData: true, createdAt: Date.now() };

    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), newLoc);
        setShowAddModal(false); showToast("រក្សាទុកជោគជ័យ!", "success");
    } catch (e) { showToast("មានបញ្ហាក្នុងការរក្សាទុក", "error"); }
  };

  const handleDeleteLocation = async (locId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', locId));
         showToast("បានលុបទីតាំងជោគជ័យ", "success");
     } catch (e) {}
  };

  const handleAdminLogin = async () => {
    if (adminPassword === 'ict168mit') { 
        setIsAdmin(true); setShowPasswordModal(false); setAdminPassword('');
        showToast('ចូលជា Admin ជោគជ័យ!', 'success');
    } else { 
        showToast('លេខសម្ងាត់មិនត្រឹមត្រូវទេ!', 'error'); 
        if (authUser) {
            try {
                const secId = Date.now().toString();
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', secId), {
                    timestamp: Date.now(), attemptedTime: new Date().toLocaleString(),
                    userAgent: navigator.userAgent, ip: 'Hidden for security'
                });
            } catch (e) {}
        }
    }
  }

  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const recenterMap = () => {
    if (map && userLocation) { 
        map.panTo(userLocation); map.setZoom(16); 
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(newPos);
                if (map) { map.panTo(newPos); map.setZoom(16); }
            }, () => showToast("សូមបើក GPS ទូរស័ព្ទរបស់អ្នក", "error")
        );
    }
  };

  const handleAiChatSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiTyping(true);

    try {
      const apiKey = ""; 
      const payload = {
        contents: [...chatMessages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: "ឆ្លើយតបជាភាសាខ្មែរខ្លីៗ គោរព និងពន្យល់ពីទីតាំងភូមិសាស្រ្តកម្ពុជា។" }] }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.candidates?.[0]?.content?.parts?.[0]?.text || "សូមអភ័យទោស។" }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "មានបញ្ហាភ្ជាប់ទៅកាន់ប្រព័ន្ធ AI។" }]);
    } finally { setIsAiTyping(false); }
  };

  return (
    <div className={`h-[100dvh] flex flex-col font-sans overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* 1. HEADER */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col select-none cursor-default">
            {/* Changed Title to Smart Map */}
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">Smart Map</h1>
            <p className="text-[10px] text-gray-500 font-bold -mt-0.5 uppercase tracking-wider">Community GPS</p>
          </div>
        </div>

        {/* Google Maps Search Bar (Desktop) */}
        <div ref={searchContainerRef} className="hidden md:flex relative flex-1 max-w-xl mx-6">
          <input 
            type="text" 
            placeholder="ស្វែងរកប្រទេស ខេត្ត ស្រុក ឃុំ ភូមិ..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-full focus:ring-2 focus:ring-blue-500 text-sm font-semibold transition-all outline-none shadow-inner"
          />
          <Search className="absolute left-4 top-3 w-4.5 h-4.5 text-gray-400" />
          {searchQuery && <X onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-4 top-3 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />}

          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden border dark:border-gray-700">
              {searchResults.map((res, idx) => (
                <button key={idx} onClick={() => handleSelectSearchResult(res)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{res.structured_formatting?.main_text || res.description}</p>
                    {res.structured_formatting?.secondary_text && <p className="text-[10px] text-gray-500 truncate">{res.structured_formatting.secondary_text}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* AI Icon Button Only */}
          <button onClick={() => setIsAiOpen(!isAiOpen)} className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white shadow-md hover:scale-105 transition-transform" title="សួរ AI">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </button>

          {/* Theme Toggle */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          {/* User Profile Menu (Colorful Image placeholder) */}
          <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800 hover:scale-105 transition-transform">
              <User className="w-5 h-5 text-white" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">គណនីបច្ចុប្បន្ន</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {isAdmin ? <><Shield className="w-4 h-4 text-emerald-500" /> Admin</> : <><User className="w-4 h-4 text-blue-500" /> ភ្ញៀវ (Visitor)</>}
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex items-center gap-2 transition-colors">
                    <UserCircle className="w-4 h-4" /> គណនីអ្នកប្រើប្រាស់
                  </button>
                  <button onClick={() => setLanguage(lang => lang === 'kh' ? 'en' : 'kh')} className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex items-center gap-2 transition-colors">
                    <Globe className="w-4 h-4" /> ប្តូរភាសា ({language === 'kh' ? 'English' : 'ខ្មែរ'})
                  </button>
                  
                  <div className="border-t dark:border-gray-700 my-1"></div>
                  
                  {!isAdmin ? (
                    <button onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl flex items-center gap-2 transition-colors">
                      <Lock className="w-4 h-4" /> ចូលជា Admin
                    </button>
                  ) : (
                    <button onClick={() => { setIsAdmin(false); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl flex items-center gap-2 transition-colors">
                      <Trash2 className="w-4 h-4" /> ចាកចេញពី Admin
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="md:hidden p-3 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-30 shrink-0 shadow-sm" ref={searchContainerMobileRef}>
         <div className="relative">
            <input type="text" placeholder="ស្វែងរកស្រុក ឃុំ ភូមិ..." value={searchQuery} onChange={handleSearchChange} className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            {searchQuery && <X onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-3 w-4 h-4 text-gray-400" />}
         </div>
         {/* Mobile search results */}
         {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-16 left-3 right-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden border dark:border-gray-700 max-h-60 overflow-y-auto">
              {searchResults.map((res, idx) => (
                <button key={idx} onClick={() => handleSelectSearchResult(res)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{res.structured_formatting?.main_text || res.description}</p>
                    {res.structured_formatting?.secondary_text && <p className="text-[10px] text-gray-500 truncate">{res.structured_formatting.secondary_text}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* LOCATION SIDEBAR (Desktop) / BOTTOM SHEET (Mobile) */}
        <aside className={`fixed md:relative bottom-0 left-0 right-0 md:right-auto w-full md:w-[350px] h-[65vh] md:h-full bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col transition-transform duration-300 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none rounded-t-3xl md:rounded-none ${isSidebarOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-x-full'}`}>
          
          {/* Bottom Sheet Drag Handle (Mobile Only) */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>

          {isAdmin ? (
            // ADMIN DASHBOARD
            <div className="flex flex-col h-full overflow-hidden">
               <div className="px-4 py-3 border-b dark:border-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                  <h2 className="font-black text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Admin Dashboard</h2>
               </div>
               
               {/* Admin Tabs */}
               <div className="flex p-2 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 shrink-0">
                  <button onClick={() => setAdminTab('locations')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${adminTab === 'locations' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>ទីតាំង</button>
                  <button onClick={() => setAdminTab('reports')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${adminTab === 'reports' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>របាយការណ៍</button>
                  <button onClick={() => setAdminTab('security')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${adminTab === 'security' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>សុវត្ថិភាព</button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 pb-10">
                  {adminTab === 'locations' && (
                     <div className="space-y-4">
                        <button onClick={handleInitiateAddDetail} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
                           <Plus className="w-4 h-4" /> បន្ថែមព័ត៌មានទីតាំងថ្មី
                        </button>
                        <p className="text-[10px] text-gray-500 text-center px-4 leading-relaxed">រាល់ទីតាំងដែលអ្នកបន្ថែម វានឹងលោតបង្ហាញនៅខាងក្រោមទីតាំងគោល ឱ្យអ្នកប្រើប្រាស់ទូទៅងាយស្រួលទាក់ទង។</p>
                     </div>
                  )}

                  {adminTab === 'reports' && (
                     <div className="space-y-4">
                        {/* Time Period Filter */}
                        <div className="flex gap-2 mb-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                          <button onClick={()=>setStatPeriod('week')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${statPeriod==='week' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>សប្តាហ៍</button>
                          <button onClick={()=>setStatPeriod('month')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${statPeriod==='month' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>ខែ</button>
                          <button onClick={()=>setStatPeriod('year')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${statPeriod==='year' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>ឆ្នាំ</button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">អ្នកប្រើប្រាស់សរុប</p>
                              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalUsers}</p>
                           </div>
                           <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">សកម្ម (២៤ម៉ោង)</p>
                              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeUsers}</p>
                           </div>
                        </div>

                        {/* CSS Bar Chart */}
                        <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm">
                           <h3 className="text-xs font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> ស្ថិតិប្រចាំ{statPeriod === 'week' ? 'សប្តាហ៍' : statPeriod === 'month' ? 'ខែ' : 'ឆ្នាំ'}</h3>
                           <div className="flex items-end justify-between h-32 gap-2 mt-2">
                              {/* Mock Data responsive to period selection */}
                              {[40, 70, 45, 90, 60, 100, activeUsers > 0 ? (activeUsers/totalUsers)*100 || 20 : 10].map((h, i) => (
                                 <div key={i} className="flex flex-col items-center flex-1 gap-2">
                                    <div className="w-full bg-blue-100 dark:bg-gray-700 rounded-t-sm relative flex items-end">
                                       <div className="w-full bg-blue-500 rounded-t-sm transition-all duration-1000" style={{ height: `${statPeriod==='week' ? h : statPeriod==='month' ? h*0.8 : h*0.5}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400">{['ច', 'អ', 'ព', 'ព្ហ', 'ស', 'សៅ', 'អា'][i]}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}

                  {adminTab === 'security' && (
                     <div className="space-y-3">
                        <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                           <AlertTriangle className="w-5 h-5 shrink-0" />
                           <p className="text-xs font-bold">មានការប៉ុនប៉ងលួចចូល {securityLogs.length} ដង</p>
                        </div>
                        {securityLogs.map(log => (
                           <div key={log.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700">
                              <p className="text-xs font-black text-gray-800 dark:text-gray-200">{log.attemptedTime}</p>
                              <p className="text-[10px] text-gray-500 mt-1 truncate">{log.userAgent}</p>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
          ) : (
            // NORMAL USER VIEW (Location List)
            <div className="flex flex-col h-full overflow-hidden">
               {/* Wrapped Filters (No Horizontal Scroll) */}
               <div className="p-4 border-b dark:border-gray-800 flex flex-wrap gap-2 shrink-0 bg-white dark:bg-gray-900">
               {['ទាំងអស់', 'សាលារៀន', 'មន្ទីរពេទ្យ / គ្លីនិក', 'ប៉ុស្តិ៍ប៉ូលីស'].map(cat => (
                  <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${activeFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 border-transparent dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                     {cat}
                  </button>
               ))}
               </div>

               {/* Location List */}
               <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-12">
               
               {/* OFFLINE MODE WIDGET */}
               {isOffline && offlineContacts.length > 0 && (
                  <div className="mb-4 bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                     <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
                     <WifiOff className="w-5 h-5" />
                     <span className="font-extrabold text-sm">លេខសង្គ្រោះ (ពេលដាច់អ៊ីនធឺណិត)</span>
                     </div>
                     <div className="space-y-2">
                     {offlineContacts.map((contact, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-900 p-3 rounded-xl flex justify-between items-center shadow-sm border border-rose-50 dark:border-rose-900/20">
                           <div>
                              <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{contact.name}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{contact.type}</p>
                           </div>
                           <a href={`tel:${contact.phone}`} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-2 rounded-lg font-black text-xs flex gap-1.5 items-center">
                              <PhoneCall className="w-3.5 h-3.5" /> ខល
                           </a>
                        </div>
                     ))}
                     </div>
                  </div>
               )}

               {/* NORMAL LOCATIONS */}
               {isFetchingPois && filteredAndSortedLocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                     <Loader2 className="w-6 h-6 animate-spin mb-3 text-blue-500" />
                     <span className="text-xs font-bold">កំពុងស្កេនទីតាំងជុំវិញអ្នក...</span>
                  </div>
               ) : filteredAndSortedLocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                     <MapPin className="w-8 h-8 mb-3 opacity-30" />
                     <span className="text-xs font-bold">រកមិនឃើញទីតាំងនៅជិតនេះទេ</span>
                  </div>
               ) : filteredAndSortedLocations.map((loc) => (
                  <div key={loc.id} onClick={() => focusLocation(loc)} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group relative overflow-hidden">
                     {loc.isAdminData && <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-bl-full flex items-start justify-end p-1.5"><span className="text-white text-[10px] font-black">✔</span></div>}
                     <div className="flex justify-between items-start pr-4">
                     <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors pr-2">
                           {loc.name}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-500 mt-1.5 bg-gray-100 dark:bg-gray-700 inline-block px-2 py-0.5 rounded-md">{loc.type}</p>
                        
                        {/* Admin Details Snippet in List */}
                        {loc.isAdminData && loc.phone && (
                           <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">ទិន្នន័យបានផ្ទៀងផ្ទាត់ដោយមន្ត្រី</p>
                              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                                 <PhoneCall className="w-3.5 h-3.5" /> {loc.phone}
                              </p>
                              <button onClick={(e) => { e.stopPropagation(); handleCall(loc); }} className="w-full mt-2.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-extrabold transition-colors shadow-sm">
                                 ចុចខលឥឡូវនេះ
                              </button>
                           </div>
                        )}
                     </div>
                     </div>
                     {loc.distance && (
                        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                           <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                           <Navigation className="w-3.5 h-3.5" /> {formatDistance(loc.distance)}
                           </span>
                        </div>
                     )}
                  </div>
               ))}
               </div>
            </div>
          )}
        </aside>
        
        {/* Toggle Button for Desktop - When Sidebar is Closed */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex absolute top-4 left-4 bg-white dark:bg-gray-900 p-2.5 rounded-xl shadow-xl z-30 hover:scale-105 border border-gray-100 dark:border-gray-800 transition-all items-center justify-center text-gray-700 dark:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* MAP CANVAS */}
        <div className="flex-1 h-full relative z-0">
          <div ref={mapRef} className="w-full h-full" />

          {/* Floating Controls (Map specific) */}
          <div className={`absolute right-4 flex flex-col gap-3 z-10 transition-all duration-300 ${isSidebarOpen ? 'bottom-[65vh] md:bottom-6' : 'bottom-6 md:bottom-6'}`}>
            
            {/* Satellite Toggle Button */}
            <button onClick={toggleMapType} title="ប្តូរផ្ទាំងផែនទី (Satellite)" className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.15)] flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-transform border dark:border-gray-700">
              <Layers className="w-6 h-6" />
            </button>

            {/* Recenter Button */}
            <button onClick={recenterMap} title="ត្រឡប់ទៅទីតាំងខ្ញុំវិញ (Recenter)" className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.15)] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:scale-105 active:scale-95 transition-transform border dark:border-gray-700">
              <Crosshair className="w-6 h-6" />
            </button>

            {/* Toggle Bottom Sheet Button (Mobile Only) */}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
              {isSidebarOpen ? <ChevronDown className="w-6 h-6" /> : <List className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* AI Chat Drawer */}
        <div className={`absolute top-0 bottom-0 right-0 w-full md:w-[350px] bg-white dark:bg-gray-900 border-l border-transparent dark:border-gray-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${isAiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              <div><h3 className="font-extrabold text-sm">Smart Map AI</h3></div>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiTyping && (
               <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm p-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleAiChatSubmit} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            <input type="text" placeholder="សួរ AI ពីទីតាំងភូមិសាស្ត្រ..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors"><Send className="w-4.5 h-4.5" /></button>
          </form>
        </div>

      </div>

      {/* MODALS */}
      
      {/* Admin Login Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6 mt-2">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white">ប្រព័ន្ធអ្នកគ្រប់គ្រង (Admin)</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">បញ្ចូលលេខកូដដើម្បីទទួលបានសិទ្ធិកែប្រែ និងមើលរបាយការណ៍</p>
            </div>
            
            <div className="space-y-4">
              <input 
                type="password" 
                placeholder="• • • • • •" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleAdminLogin(); }}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl text-center text-xl font-black tracking-[0.5em] transition-all outline-none"
                autoFocus
              />
              <button onClick={handleAdminLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                ចូលប្រព័ន្ធ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-emerald-500 w-5 h-5" /> បន្ថែមទីតាំងថ្មី
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">ឈ្មោះទីតាំងពិតប្រាកដ / ឈ្មោះមេភូមិ</label>
                <input type="text" placeholder="ឧ. មន្ទីរពេទ្យបង្អែក ឬ ផ្ទះមេភូមិ..." value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold border-none outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">លេខទូរស័ព្ទផ្លូវការ</label>
                <input type="text" placeholder="012 345 678" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold border-none outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">ប្រភេទទីតាំង</label>
                <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold border-none outline-none">
                  <option value="សាលារៀន">សាលារៀន</option>
                  <option value="មន្ទីរពេទ្យ / គ្លីនិក">មន្ទីរពេទ្យ / គ្លីនិក</option>
                  <option value="ប៉ុស្តិ៍ប៉ូលីស">ប៉ុស្តិ៍ប៉ូលីស</option>
                  <option value="សាលាឃុំ / ផ្ទះមេភូមិ">សាលាឃុំ / ផ្ទះមេភូមិ</option>
                </select>
              </div>
            </div>

            <button onClick={saveLocation} className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95">
              រក្សាទុកទៅកាន់ ប្រព័ន្ធ
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 border animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'}`}>
          <span className="font-extrabold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}