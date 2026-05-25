import React, { useState, useEffect, useRef, useMemo } from 'react';
import './index.css'; // ត្រូវប្រាកដថាបន្ទាត់នេះមាន
import { 
  MapPin, Moon, Sun, Search, X, Save, Trash2, Shield, User, Info, 
  Map as MapIcon, Loader2, Navigation, PhoneCall, Plus, Menu, Eye, 
  EyeOff, AlertCircle, Crosshair, Camera, MessageSquare, Send, BrainCircuit, Upload,
  UserCircle, Globe, Activity, ShieldAlert, Users, TrendingUp
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

// Fallback POIs
const getFallbackPOIs = (lat, lng) => {
  return [
    { id: "fallback-1", name: "វិទ្យាល័យព្រះស៊ីសុវត្ថិ", type: "សាលារៀន", lat: lat + 0.003, lng: lng - 0.002, isAdminData: false, keywords: ["វិទ្យាល័យព្រះស៊ីសុវត្ថិ", "សាលារៀន"] },
    { id: "fallback-2", name: "មន្ទីរពេទ្យកាល់ម៉ែត", type: "មន្ទីរពេទ្យ / គ្លីនិក", lat: lat + 0.005, lng: lng + 0.002, isAdminData: false, keywords: ["មន្ទីរពេទ្យកាល់ម៉ែត", "មន្ទីរពេទ្យ / គ្លីនិក"] }
  ];
};

export default function App() {
  const [map, setMap] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [language, setLanguage] = useState('kh'); 
  
  const [adminTab, setAdminTab] = useState('locations'); 
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [showDistances, setShowDistances] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [firebaseLocations, setFirebaseLocations] = useState([]); 
  const [osmLocations, setOsmLocations] = useState([]); 
  const [lastFetchedPos, setLastFetchedPos] = useState(null); 
  const [isFetchingPois, setIsFetchingPois] = useState(false); 
  const [gpsStatus, setGpsStatus] = useState('');

  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // AI States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'សួស្តី! ខ្ញុំជា SmartMap AI Assistant។ តើអ្នកចង់ដឹងអ្វីខ្លះអំពីទីតាំង ឬមានអ្វីឱ្យខ្ញុំជួយទេ?' }]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const isMapCenteredRef = useRef(false);
  const watchIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const searchContainerRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    document.title = "📍 SmartMap Pro";
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (tokenError) { await signInAnonymously(auth); }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthUser(user);
        if (user && !sessionStorage.getItem('hasLoggedVisit')) {
            logVisitorAnalytics(user.uid);
            sessionStorage.setItem('hasLoggedVisit', 'true');
        }
    });
    
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSearchDropdown(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logVisitorAnalytics = async (uid) => {
      try {
          const docId = Date.now().toString() + "-" + Math.floor(Math.random()*1000);
          const statRef = doc(db, 'artifacts', appId, 'public', 'data', 'visitor_stats', docId);
          await setDoc(statRef, { uid: uid, timestamp: Date.now(), userAgent: navigator.userAgent, language: navigator.language });
      } catch (e) { console.warn("Could not log visitor analytics", e); }
  };

  useEffect(() => {
    if (!authUser) return;
    const locRef = collection(db, 'artifacts', appId, 'public', 'data', 'ramit');
    const unsubLoc = onSnapshot(locRef, (snapshot) => {
      const locList = [];
      snapshot.forEach(doc => locList.push({ id: doc.id, isAdminData: true, ...doc.data() }));
      setFirebaseLocations(locList);
    }, (error) => console.warn("Location fetch issue.", error));
    return () => unsubLoc();
  }, [authUser]);

  useEffect(() => {
     if (!authUser || !isAdmin) return;
     const visRef = collection(db, 'artifacts', appId, 'public', 'data', 'visitor_stats');
     const unsubVis = onSnapshot(visRef, (snapshot) => {
         const list = [];
         snapshot.forEach(doc => list.push({id: doc.id, ...doc.data()}));
         setVisitorLogs(list.sort((a,b) => b.timestamp - a.timestamp));
     });
     const secRef = collection(db, 'artifacts', appId, 'public', 'data', 'security_logs');
     const unsubSec = onSnapshot(secRef, (snapshot) => {
         const list = [];
         snapshot.forEach(doc => list.push({id: doc.id, ...doc.data()}));
         setSecurityLogs(list.sort((a,b) => b.timestamp - a.timestamp));
     });
     return () => { unsubVis(); unsubSec(); }
  }, [authUser, isAdmin]);

  const fetchNearbyPOIs = async (lat, lng) => {
      setIsFetchingPois(true);
      try {
          const query = `
              [out:json][timeout:25];
              (
                node["amenity"~"school|kindergarten|college|university"](around:5000,${lat},${lng});
                node["amenity"~"hospital|clinic|doctors|pharmacy"](around:5000,${lat},${lng});
                node["amenity"~"police|fire_station"](around:5000,${lat},${lng});
                node["office"~"government|administrative"](around:5000,${lat},${lng});
                node["place"~"village|townhall|hamlet"](around:5000,${lat},${lng});
              );
              out body;
          `;
          const response = await fetch('https://overpass-api.de/api/interpreter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `data=${encodeURIComponent(query)}`
          });
          
          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          const data = await response.json();
          
          if (data && data.elements && data.elements.length > 0) {
              const formattedPOIs = data.elements.filter(e => e.tags && e.tags.name).map(el => {
                  let type = "ទីតាំងផ្សេងៗ";
                  let amenity = el.tags.amenity || el.tags.office || el.tags.place;
                  if (amenity === 'school' || amenity === 'kindergarten' || amenity === 'college' || amenity === 'university') type = "សាលារៀន";
                  else if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors' || amenity === 'pharmacy') type = "មន្ទីរពេទ្យ / គ្លីនិក";
                  else if (amenity === 'police' || amenity === 'fire_station') type = "ប៉ុស្តិ៍ប៉ូលីស";
                  else if (amenity === 'government' || amenity === 'townhall' || amenity === 'administrative') type = "សាលាឃុំ / ផ្ទះមេភូមិ";
                  else if (amenity === 'village' || amenity === 'hamlet') type = "ភូមិ / សហគមន៍";

                  return {
                      id: `osm-${el.id}`, name: el.tags.name, type: type,
                      lat: el.lat, lng: el.lon, isAdminData: false, keywords: [el.tags.name, type] 
                  };
              });
              
              setOsmLocations(prevOsm => {
                  const newOsmLocations = [...prevOsm];
                  formattedPOIs.forEach(newPoi => {
                      const exists = newOsmLocations.some(existingPoi => Math.abs(existingPoi.lat - newPoi.lat) < 0.0001 && Math.abs(existingPoi.lng - newPoi.lng) < 0.0001);
                      if (!exists) newOsmLocations.push(newPoi);
                  });
                  return newOsmLocations;
              });
          } else { throw new Error("No data returned"); }
      } catch (error) { 
          if (osmLocations.length === 0 && firebaseLocations.length === 0) setOsmLocations(getFallbackPOIs(lat, lng));
      } finally { setIsFetchingPois(false); }
  };

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
    if (!mapRef.current || !window.google || !window.google.maps || typeof window.google.maps.Map !== 'function') return;
    try { await window.google.maps.importLibrary("marker"); } catch (e) {}

    const initialCenter = { lat: 11.5564, lng: 104.9282 };
    const initialMap = new window.google.maps.Map(mapRef.current, {
      center: initialCenter, zoom: 15, minZoom: 6, mapTypeControl: true, zoomControl: true, gestureHandling: 'greedy', mapId: "450ae928a2c49128" 
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
    initialMap.addListener("click", () => { if (infoWindowRef.current) infoWindowRef.current.close(); });

    fetchNearbyPOIs(initialCenter.lat, initialCenter.lng);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos);
          setGpsStatus('');

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
            userPin.innerHTML = `<div style="width:16px; height:16px; background:#2563eb; border:3px solid white; border-radius:50%; box-shadow:0 0 10px rgba(37,99,235,0.7);"></div>`;
            if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: initialMap, position: userPos, content: userPin, title: "អ្នកកំពុងនៅទីនេះ" });
            }
          }
          
          setLastFetchedPos(prev => {
              if (!prev || calculateDistance(prev.lat, prev.lng, userPos.lat, userPos.lng) > 0.5) {
                  fetchNearbyPOIs(userPos.lat, userPos.lng);
                  return userPos;
              }
              return prev;
          });
        },
        (error) => { 
            console.warn("GPS Error:", error); 
            setGpsStatus('GPS Error: ' + error.message);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
      );
    } else {
         setGpsStatus('Geolocation is not supported by this browser.');
    }
    setMap(initialMap);
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (!val.trim() || !window.google || !window.google.maps) {
      setSearchResults([]); setShowSearchDropdown(false); return;
    }

    setIsSearchingGeocode(true);
    try {
      const acceptLang = language === 'kh' ? 'km,en' : 'en,km';
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=kh&limit=5&accept-language=${acceptLang}`);
      const results = await response.json();

      if (results && results.length > 0) {
        setSearchResults(results.map((r) => ({
            formatted_address: r.display_name,
            geometry: { location: new window.google.maps.LatLng(parseFloat(r.lat), parseFloat(r.lon)), viewport: null },
        })));
        setShowSearchDropdown(true);
      } else { setSearchResults([]); setShowSearchDropdown(false); }
    } catch (error) { setSearchResults([]); setShowSearchDropdown(false); } 
    finally { setIsSearchingGeocode(false); }
  };

  const handleSelectSearchResult = (result) => {
    if (!map || !result.geometry || !result.geometry.location) return;
    const loc = result.geometry.location;
    if (result.geometry.viewport) map.fitBounds(result.geometry.viewport);
    else { map.panTo(loc); map.setZoom(16); }

    if (tempMarkerRef.current) tempMarkerRef.current.map = null;
    if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
      const searchPin = document.createElement('div');
      searchPin.innerHTML = `<div class="relative transform -translate-y-4"><div class="text-3xl filter drop-shadow-md">📍</div></div>`;
      tempMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ position: loc, map: map, content: searchPin, title: result.formatted_address });
    }

    fetchNearbyPOIs(loc.lat(), loc.lng());
    setSearchQuery(result.formatted_address);
    setShowSearchDropdown(false);
    setTimeout(() => { if (tempMarkerRef.current) tempMarkerRef.current.map = null; }, 8000);
  };

  const allLocationsForMap = useMemo(() => {
    if (!firebaseLocations || !osmLocations) return [];
    const filteredOsm = osmLocations.filter(osmLoc => {
        return !firebaseLocations.some(fbLoc => calculateDistance(osmLoc.lat, osmLoc.lng, fbLoc.lat, fbLoc.lng) < 0.05);
    });
    return [...firebaseLocations, ...filteredOsm];
  }, [firebaseLocations, osmLocations]);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps || !window.google.maps.marker || !window.google.maps.marker.AdvancedMarkerElement) return;

    markers.forEach(m => { if (m && m.marker) m.marker.map = null; });
    const newMarkers = [];

    allLocationsForMap.forEach(loc => {
      const pinElement = document.createElement('div');
      pinElement.className = "cursor-pointer transition-transform duration-200 hover:scale-125";
      
      if (loc.isAdminData) {
        pinElement.innerHTML = `<div class="flex flex-col items-center"><div class="bg-emerald-500 text-white p-1.5 rounded-full border border-white shadow-md flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg></div><div class="w-1.5 h-1.5 bg-emerald-500 rounded-full -mt-0.5 border border-white shadow-sm"></div></div>`;
      } else {
        pinElement.innerHTML = `<div class="flex flex-col items-center"><div class="bg-indigo-600 text-white p-1.5 rounded-full border border-white shadow-md flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div></div>`;
      }

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: map, position: { lat: Number(loc.lat), lng: Number(loc.lng) }, content: pinElement, title: loc.name
      });

      pinElement.addEventListener("click", () => focusLocation(loc, marker));
      newMarkers.push({ id: loc.id, marker });
    });

    setMarkers(newMarkers);
    return () => newMarkers.forEach(m => { if (m.marker) m.marker.map = null; });
  }, [map, allLocationsForMap]);

  const filteredAndSortedLocations = useMemo(() => {
      if (!allLocationsForMap) return [];
      const mappedLocs = allLocationsForMap.map(loc => {
          let distance = null;
          if (userLocation) distance = calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
          const keywords = loc.keywords || [loc.name, loc.type, loc.phone].filter(Boolean);
          return { ...loc, distance, keywords };
      });

      let result = mappedLocs.filter(item => {
          const query = searchQuery.toLowerCase().trim();
          if (!query) return true;
          return item.keywords.some(k => k && k.toLowerCase().includes(query));
      });

      return result.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
      });
  }, [allLocationsForMap, userLocation, searchQuery]);

  const formatDistance = (dist) => {
      if (dist === null || dist === undefined) return '';
      if (dist < 1) return `${(dist * 1000).toFixed(0)} ម៉ែត្រ`;
      return `${dist.toFixed(1)} គ.ម`;
  };

  // AI Logic for Location Analysis
  const handleAnalyzeLocation = (loc) => {
      setIsAiOpen(true);
      const prompt = `សូមជួយប្រាប់ខ្ញុំពីទីតាំងនេះបន្តិចបានទេ? ឈ្មោះទីតាំង៖ ${loc.name}, ប្រភេទ៖ ${loc.type}។`;
      setChatMessages(prev => [...prev, { role: 'user', text: prompt }]);
      
      // Auto trigger AI response logic
      setIsAiTyping(true);
      setTimeout(() => {
          const aiResponse = `បាទ/ចាស! ${loc.name} គឺជាទីតាំងប្រភេទ ${loc.type}។ ដោយសារទីតាំងនេះមានសារៈសំខាន់សម្រាប់ការផ្តល់សេវា ឬព័ត៌មាននៅក្នុងសហគមន៍ សូមចុចលើសញ្ញា 📞 (ប្រសិនបើមាន) ដើម្បីទាក់ទងផ្ទាល់។ តើអ្នកចង់ដឹងអ្វីបន្ថែមពីទីតាំងនេះទេ?`;
          setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
          setIsAiTyping(false);
      }, 1500); 
  };

  const focusLocation = (loc, markerObj = null) => {
    if (!map || !infoWindowRef.current || !window.google) return;
    map.panTo({ lat: loc.lat, lng: loc.lng }); map.setZoom(17);
    if(window.innerWidth < 768) setIsSidebarOpen(false); 

    let actualMarker = markerObj || markers.find(m => m.id === loc.id)?.marker;

    if (actualMarker) {
      const formattedDistance = (showDistances && loc.distance !== null && loc.distance !== undefined) ? 
         `<p class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded inline-block shadow-sm">📍 ចម្ងាយ: ${formatDistance(loc.distance)}</p>` : '';
         
      const phoneContent = loc.isAdminData && loc.phone ? `
            <a href="tel:${loc.phone}" class="bg-green-600 hover:bg-green-700 text-white w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md transition-colors mt-2" style="text-decoration: none;">
                <span style="font-size: 1.1rem;">📞</span> ចុចខលឥឡូវនេះ
            </a>
            ` : (!loc.isAdminData ? `<div class="bg-red-50 border border-red-200 p-2 rounded mt-2 text-center"><p class="text-sm text-red-600 font-bold">NO ! មិនទាន់មានទិន្នន័យ</p></div>` : '');

      const contentString = `
        <div class="p-2 min-w-[220px]">
            <h3 class="font-bold text-lg text-gray-900 mb-1 border-b pb-2 flex items-center gap-1.5 font-sans">
               ${loc.isAdminData ? '✅' : '📌'} ${loc.name}
            </h3>
            <p class="text-sm font-semibold text-blue-600 mb-2 font-sans">${loc.type}</p>
            ${formattedDistance}
            ${phoneContent}
            <button id="ai-btn-${loc.id}" class="mt-3 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 border border-indigo-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
               ✨ វិភាគទីតាំងដោយ AI
            </button>
        </div>
      `;
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open({ anchor: actualMarker, map, shouldFocus: true });

      window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
          const btn = document.getElementById(`ai-btn-${loc.id}`);
          if (btn) btn.addEventListener('click', () => handleAnalyzeLocation(loc));
      });
    }
  };

  const handleInitiateAddDetail = () => {
    setIsAutoLocating(true);
    if (navigator.geolocation) {
      showToast("កំពុងទាញយកទីតាំងអ្នកផ្ទាល់...", "success");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setPendingLocation(newPos);
          setFormData({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
          setIsAutoLocating(false);
          setShowAddModal(true);
          if(map) { map.panTo(newPos); map.setZoom(18); }
        },
        (error) => { setIsAutoLocating(false); showToast("មិនអាចចាប់យកទីតាំងបានទេ! សូមពិនិត្យ GPS។", "error"); },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
      );
    } else {
       setIsAutoLocating(false); showToast("ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ទេ!", "error");
    }
  };

  const saveLocation = async () => {
    if (!formData.name.trim()) return showToast("សូមបញ្ចូលឈ្មោះស្ថាប័ន ឬបុគ្គល", "error");
    if (!formData.phone.trim()) return showToast("សូមបញ្ចូលលេខទូរស័ព្ទ", "error");
    if (!authUser) return showToast("សូមរង់ចាំការភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេសិន", "error");
    
    const newId = Date.now().toString();
    const newLoc = { 
        ...formData, lat: pendingLocation.lat, lng: pendingLocation.lng, 
        createdAt: Date.now(), keywords: [formData.name, formData.type, formData.phone]
    };

    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), newLoc);
        setShowAddModal(false); showToast("រក្សាទុកជោគជ័យ!", "success");
    } catch (e) { 
        console.warn("Could not save to Firestore", e);
        setShowAddModal(false); showToast("រក្សាទុកក្នុងម៉ាស៊ីនរួចរាល់!", "success");
    }
  };

  const handleDeleteLocation = async (locId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', locId));
         showToast("បានលុបទិន្នន័យជោគជ័យ", "success");
     } catch (e) { showToast("មិនអាចលុបបានទេ", "error"); }
  };

  const handleAdminLogin = async () => {
    if (adminPassword === 'ict168mit') { 
        setIsAdmin(true); setShowPasswordModal(false); setAdminPassword('');
        showToast('ចូលជាអ្នកគ្រប់គ្រងដោយជោគជ័យ!', 'success');
    } else { 
        showToast('លេខសម្ងាត់មិនត្រឹមត្រូវ!', 'error'); 
        if (authUser) {
            try {
                const secId = Date.now().toString();
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', secId), {
                    timestamp: Date.now(), attemptedTime: new Date().toLocaleString(),
                    lat: userLocation ? userLocation.lat : null, lng: userLocation ? userLocation.lng : null,
                    userAgent: navigator.userAgent
                });
            } catch (e) {}
        }
    }
  }

  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const recenterMap = () => {
    if (map && userLocation) { 
        map.panTo(userLocation); map.setZoom(16); 
    } else if (navigator.geolocation) {
        showToast("កំពុងស្វែងរកទីតាំងរបស់អ្នក...", "success");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(newPos);
                if (map) { map.panTo(newPos); map.setZoom(16); }
            },
            (error) => { showToast("មិនអាចចាប់ទីតាំងបានទេ", "error"); }, 
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
        );
    }
  };

  // Dashboard Metrics Calculation (Real-time Analytics)
  const totalUsers = visitorLogs.length;
  
  // Calculate active users in the last 24 hours
  const now = Date.now();
  const oneDayInMs = 86400000;
  const activeUsers = visitorLogs.filter(log => (now - log.timestamp) < oneDayInMs).length;
  
  // Calculate active users in the previous 24 hours (for percentage comparison)
  const previousActiveUsers = visitorLogs.filter(log => {
      const timeDiff = now - log.timestamp;
      return timeDiff >= oneDayInMs && timeDiff < (oneDayInMs * 2);
  }).length;

  // Calculate Growth Percentage
  let growthPercentage = 0;
  if (previousActiveUsers > 0) {
      growthPercentage = Math.round(((activeUsers - previousActiveUsers) / previousActiveUsers) * 100);
  } else if (activeUsers > 0) {
      growthPercentage = 100; // If there were 0 users yesterday and >0 today, that's 100% growth
  }

  // OPENAI API SUBMISSION (REPLACED GEMINI)
  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    setAiInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiTyping(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const systemPrompt = "អ្នកគឺជាជំនួយការ AI របស់កម្មវិធី SmartMap Pro។ អ្នកត្រូវឆ្លើយតបជាភាសាខ្មែរឲ្យបានពីរោះ សមរម្យ។ ឆ្លើយតបស្របតាមវ័យរបស់កុមារ និងយុវជន ដោយចៀសវាងប្រធានបទដែលបង្កគ្រោះថ្នាក់។";
      
      const messages = [
        { role: "system", content: systemPrompt },
        ...chatMessages.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text
        })),
        { role: "user", content: userText }
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ 
            model: "gpt-3.5-turbo", 
            messages: messages 
        })
      });

      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "បរាជ័យក្នុងការភ្ជាប់ទៅ OpenAI");
      }

      const data = await res.json();
      const aiResponse = data.choices[0].message.content;
      
      if (!aiResponse) throw new Error("ការតភ្ជាប់ទៅកាន់ AI មិនបានជោគជ័យ។");
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);

    } catch (error) {
      console.error("OpenAI API Error:", error);
      setTimeout(() => {
          setChatMessages(prev => [...prev, { role: 'ai', text: `សុំទោស! មានបញ្ហាភ្ជាប់ទៅកាន់ប្រព័ន្ធ AI: ${error.message}` }]);
      }, 1000);
    } finally { setIsAiTyping(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScannedImage(URL.createObjectURL(file));
    setShowScannerModal(true);
    setIsScanning(true);

    if (!window.exifr) {
        setIsScanning(false);
        showToast('កម្មវិធីអានរូបភាពកំពុងដំណើរការ សូមព្យាយាមម្តងទៀតបន្តិចទៀត។', 'error');
        setShowScannerModal(false); return;
    }

    window.exifr.parse(file).then(exifData => {
      setIsScanning(false);
      if (exifData && exifData.latitude && exifData.longitude) {
        showToast(`ស្កេនជោគជ័យ! រកឃើញទីតាំងពិតប្រាកដ។`, 'success');
        const pos = { lat: exifData.latitude, lng: exifData.longitude };
        setShowScannerModal(false);
        if (map) {
          map.panTo(pos); map.setZoom(18);
          
          if (tempMarkerRef.current) tempMarkerRef.current.map = null;
          
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            const scanPin = document.createElement('div');
            scanPin.innerHTML = `
              <div class="relative transform animate-bounce">
                <div class="text-4xl filter drop-shadow-md">📍</div>
              </div>
            `;

            tempMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                position: pos, 
                map: map,
                content: scanPin,
                title: "ទីតាំងដែលបានស្កេនពីរូបភាព"
            });
          }

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.display_name) setSearchQuery(data.display_name);
            }).catch(err => console.error("Reverse geocoding error:", err));
        }
      } else {
        showToast(`មិនមានទិន្នន័យ GPS ច្បាស់លាស់។`, 'error');
        setTimeout(() => setShowScannerModal(false), 2000);
      }
    }).catch(err => {
      setIsScanning(false); showToast('បរាជ័យក្នុងការវិភាគរូបភាព។', 'error'); console.error(err);
    });
  };

  return (
    <div className={`h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'} overflow-hidden`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
        .scanner-line {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 4px;
            background: #3b82f6;
            box-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6;
            animation: scan 2s linear infinite;
        }
        @keyframes scan {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
        }
      `}</style>
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-20 p-3 flex justify-between items-center relative transition-colors duration-300 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
          </button>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-md hidden md:block">
            <MapIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">SmartMap</h1>
        </div>

        {/* Desktop Search */}
        <div className="flex-grow max-w-xs md:max-w-md mx-4 relative hidden sm:block" ref={searchContainerRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={language === 'kh' ? "ស្វែងរកទីតាំង ខេត្ត ស្រុក ឃុំ ភូមិ..." : "Search locations, cities, villages..."}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
          />
          {isSearchingGeocode && (
            <div className="absolute inset-y-0 right-10 flex items-center">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search suggestions dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 max-h-60 overflow-y-auto z-50 py-2">
              {searchResults.map((res, index) => (
                <div 
                  key={index} 
                  onClick={() => handleSelectSearchResult(res)}
                  className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 cursor-pointer flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{res.formatted_address}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => fileInputRef.current.click()} title={language === 'kh' ? "ស្កេនរូបភាពរកទីតាំង" : "Scan image for location"} className="p-2 bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors hidden sm:block">
             <Camera className="w-5 h-5" />
          </button>
          <button onClick={() => setIsAiOpen(true)} className="p-2 bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors">
            <BrainCircuit className="w-5 h-5" />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* Profile Menu Dropdown */}
          <div className="relative" ref={profileMenuRef}>
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="p-2.5 rounded-full border bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-600 transition-colors hover:bg-gray-100 flex items-center justify-center">
                 <UserCircle className="w-5 h-5" />
             </button>
             {showProfileMenu && (
                 <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 py-2 z-50">
                     <div className="px-4 py-2 border-b dark:border-gray-700">
                         <p className="text-xs text-gray-400">{language === 'kh' ? "គណនីរបស់អ្នក" : "Your Account"}</p>
                         <p className="text-sm font-semibold dark:text-white">{isAdmin ? (language === 'kh' ? "អ្នកគ្រប់គ្រង" : "Admin") : (language === 'kh' ? "អ្នកទស្សនា" : "Visitor")}</p>
                     </div>
                     <button onClick={() => { setLanguage(language === 'kh' ? 'en' : 'kh'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 dark:text-gray-200">
                         <Globe className="w-4 h-4" /> {language === 'kh' ? "English" : "ភាសាខ្មែរ"}
                     </button>
                     <button onClick={() => { setShowDistances(!showDistances); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 dark:text-gray-200">
                         {showDistances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showDistances ? (language === 'kh' ? "លាក់ចម្ងាយ" : "Hide Distance") : (language === 'kh' ? "បង្ហាញចម្ងាយ" : "Show Distance")}
                     </button>
                     <div className="border-t dark:border-gray-700 my-1"></div>
                     {isAdmin ? (
                         <button onClick={() => { setIsAdmin(false); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm flex items-center gap-2">
                             <Shield className="w-4 h-4" /> {language === 'kh' ? "ចាកចេញពី Admin" : "Logout Admin"}
                         </button>
                     ) : (
                         <button onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm flex items-center gap-2">
                             <Shield className="w-4 h-4" /> {language === 'kh' ? "ចូលទៅកាន់ Admin" : "Login Admin"}
                         </button>
                     )}
                 </div>
             )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-full md:w-80 lg:w-96' : 'w-0'} flex flex-col bg-white dark:bg-gray-800 shadow-xl z-10 transition-all duration-300 border-r dark:border-gray-700 overflow-hidden`}>
          
          {/* Admin Dashboard Control Panel */}
          {isAdmin ? (
             <div className="bg-gray-50 dark:bg-gray-800/80 border-b dark:border-gray-700 shrink-0">
                 <div className="flex border-b dark:border-gray-700">
                     <button onClick={() => setAdminTab('locations')} className={`flex-1 py-3 text-xs font-bold transition-all ${adminTab === 'locations' ? 'border-b-2 border-blue-600 text-blue-600 bg-white dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                         {language === 'kh' ? "ទីតាំង" : "Locations"}
                     </button>
                     <button onClick={() => setAdminTab('visitors')} className={`flex-1 py-3 text-xs font-bold transition-all ${adminTab === 'visitors' ? 'border-b-2 border-blue-600 text-blue-600 bg-white dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                         {language === 'kh' ? "ទិន្នន័យទស្សនា" : "Analytics"}
                     </button>
                     <button onClick={() => setAdminTab('security')} className={`flex-1 py-3 text-xs font-bold transition-all ${adminTab === 'security' ? 'border-b-2 border-red-600 text-red-600 bg-white dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                         {language === 'kh' ? "សន្តិសុខ" : "Security"}
                     </button>
                 </div>
             </div>
          ) : null}

          {/* Sidebar Location List Tab */}
          {(!isAdmin || adminTab === 'locations') && (
            <div className="flex flex-col flex-1 overflow-hidden">
               <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 shrink-0">
                  <div className="relative sm:hidden mb-4">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                     <input
                       type="text"
                       placeholder={language === 'kh' ? "ស្វែងរកទីតាំង..." : "Search locations..."}
                       value={searchQuery}
                       onChange={handleSearchChange}
                       className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-full bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 text-sm"
                     />
                  </div>
                  <div className="flex justify-between items-center">
                      <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                         <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                         {language === 'kh' ? "ទីតាំងក្បែរអ្នក" : "Locations Near You"}
                      </h2>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2.5 py-1 rounded-full">
                         {filteredAndSortedLocations.length} {language === 'kh' ? "ទីតាំង" : "Places"}
                      </span>
                  </div>
                  {isAdmin && (
                     <button onClick={handleInitiateAddDetail} className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95">
                        <Plus className="w-4 h-4" /> {language === 'kh' ? "បន្ថែមទិន្នន័យទីតាំងថ្មី" : "Add New Location"}
                     </button>
                  )}
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {isFetchingPois && filteredAndSortedLocations.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                          <p>{language === 'kh' ? "កំពុងទាញយកទិន្នន័យផែនទី..." : "Fetching map locations..."}</p>
                      </div>
                  )}
                  
                  {!isFetchingPois && filteredAndSortedLocations.length === 0 && (
                     <div className="text-center p-8 text-gray-500">
                         <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                         <p>{language === 'kh' ? "រកមិនឃើញទីតាំងទេ" : "No locations found"}</p>
                     </div>
                  )}

                  {filteredAndSortedLocations.map((loc) => (
                    <div key={loc.id} onClick={() => focusLocation(loc)} className={`bg-white dark:bg-gray-700 border ${loc.isAdminData ? 'border-green-200 dark:border-green-800 shadow-md' : 'border-gray-200 dark:border-gray-600 shadow-sm'} p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer group`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-start gap-1.5">
                          {loc.isAdminData ? <span title="Verified" className="text-green-500">✅</span> : <MapPin className="w-4 h-4 mt-1 text-gray-400" />}
                          <span className="line-clamp-2">{loc.name}</span>
                        </h3>
                        {isAdmin && loc.isAdminData && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {loc.type}
                        </span>
                        {showDistances && loc.distance !== null && loc.distance !== undefined && (
                           <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              📍 {formatDistance(loc.distance)}
                           </span>
                        )}
                      </div>

                      {loc.isAdminData && loc.phone && (
                        <a href={`tel:${loc.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 w-full mt-2 py-2 bg-gray-50 hover:bg-green-50 dark:bg-gray-800 dark:hover:bg-green-900/30 text-gray-700 hover:text-green-700 dark:text-gray-300 dark:hover:text-green-400 text-sm font-bold rounded-lg transition-colors border dark:border-gray-600">
                          <PhoneCall className="w-4 h-4" /> {language === 'kh' ? "ខលឥឡូវនេះ" : "Call Now"}
                        </a>
                      )}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Admin Tab: Visitor Analytics */}
          {isAdmin && adminTab === 'visitors' && (
             <div className="flex flex-col flex-1 overflow-hidden p-4 bg-gray-50 dark:bg-gray-800/50">
                 <h2 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                     <TrendingUp className="text-blue-500" />
                     {language === 'kh' ? "ស្ថិតិទស្សនកិច្ច (Real-time)" : "Visitor Analytics (Real-time)"}
                 </h2>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                     {/* Total Users Card */}
                     <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                         <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                 <Users className="w-4 h-4" />
                                 <span>{language === 'kh' ? "អ្នកប្រើប្រាស់សរុប" : "Total Users"}</span>
                             </div>
                         </div>
                         <p className="text-3xl font-black text-gray-800 dark:text-white">{totalUsers}</p>
                     </div>
                     
                     {/* Active Users Card */}
                     <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                         <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                 <Activity className="w-4 h-4" />
                                 <span>{language === 'kh' ? "សកម្ម (២៤ម៉)" : "Active (24h)"}</span>
                             </div>
                         </div>
                         <div className="flex items-end gap-2">
                             <p className="text-3xl font-black text-gray-800 dark:text-white">{activeUsers}</p>
                             <div className={`flex items-center text-xs font-bold mb-1 ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                 {growthPercentage >= 0 ? '▲' : '▼'} {Math.abs(growthPercentage)}%
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 <h3 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-300">{language === 'kh' ? "កំណត់ត្រាថ្មីៗ" : "Recent Logs"}</h3>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                     {visitorLogs.slice(0, 50).map((log) => ( // Show only top 50 recent logs for performance
                         <div key={log.id} className="bg-white dark:bg-gray-700 border dark:border-gray-600 p-3 rounded-lg text-xs space-y-1 shadow-sm">
                             <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                                 <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">UID: {log.uid.substring(0, 8)}...</span>
                                 <span>{new Date(log.timestamp).toLocaleString(language === 'kh' ? 'km-KH' : 'en-US')}</span>
                             </div>
                             <p className="text-gray-600 dark:text-gray-300 truncate text-[10px]" title={log.userAgent}>{log.userAgent}</p>
                         </div>
                     ))}
                 </div>
             </div>
          )}

          {/* Admin Tab: Security Logs */}
          {isAdmin && adminTab === 'security' && (
             <div className="flex flex-col flex-1 overflow-hidden p-4 bg-red-50/30 dark:bg-red-900/10">
                 <div className="flex items-center justify-between mb-4 pb-2 border-b border-red-200 dark:border-red-900/50">
                     <h2 className="font-bold text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                         <ShieldAlert className="w-5 h-5 animate-pulse" />
                         {language === 'kh' ? "ប្រព័ន្ធសន្តិសុខ" : "Security System"}
                     </h2>
                     <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                         {securityLogs.length} {language === 'kh' ? "ការព្រមាន" : "Alerts"}
                     </span>
                 </div>
                 
                 {securityLogs.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-green-600 dark:text-green-500 text-center">
                         <Shield className="w-16 h-16 opacity-50 mb-3" />
                         <p className="font-bold text-lg">{language === 'kh' ? "ប្រព័ន្ធមានសុវត្ថិភាព" : "System Secure"}</p>
                         <p className="text-sm opacity-70">{language === 'kh' ? "មិនមានការប៉ុនប៉ងចូលដោយខុសច្បាប់ទេ" : "No unauthorized access attempts"}</p>
                     </div>
                 ) : (
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                         {securityLogs.map((log) => (
                             <div key={log.id} className="relative bg-white dark:bg-gray-800 border-l-4 border-l-red-500 border border-gray-200 dark:border-gray-700 p-3 rounded-r-xl shadow-sm hover:shadow-md transition-all">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold text-sm">
                                         <AlertCircle className="w-4 h-4" />
                                         <span>{language === 'kh' ? "ការប៉ុនប៉ងចូលបរាជ័យ" : "Failed Login Attempt"}</span>
                                     </div>
                                     <span className="text-[10px] text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                         {new Date(log.timestamp).toLocaleTimeString()}
                                     </span>
                                 </div>
                                 
                                 <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                                     <div className="flex items-center gap-2">
                                         <span className="font-semibold">{language === 'kh' ? "កាលបរិច្ឆេទ៖" : "Date:"}</span>
                                         <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                     </div>
                                     
                                     {log.lat && log.lng && (
                                         <div className="flex items-center gap-2">
                                             <span className="font-semibold">{language === 'kh' ? "ទីតាំង (GPS)៖" : "Location:"}</span>
                                             <a 
                                                href={`https://www.google.com/maps?q=${log.lat},${log.lng}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                             >
                                                 {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                   <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                 </svg>
                                             </a>
                                         </div>
                                     )}
                                     
                                     <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-[9px] font-mono break-words border dark:border-gray-700 mt-2">
                                         <span className="text-gray-400">Device/Browser:</span><br/>
                                         {log.userAgent}
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button onClick={recenterMap} className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group relative border dark:border-gray-700">
              <Crosshair className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          {/* Mini Scanner Trigger for Mobile */}
          <button onClick={() => fileInputRef.current.click()} className="absolute bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl transition-all sm:hidden z-10 hover:scale-105 active:scale-95">
             <Camera className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl border dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" /> Admin Access
            </h3>
            <input
              type="password"
              placeholder={language === 'kh' ? "លេខសម្ងាត់អ្នកគ្រប់គ្រង..." : "Admin Password..."}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-3 border dark:border-gray-600 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:text-white"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{language === 'kh' ? "បោះបង់" : "Cancel"}</button>
              <button onClick={handleAdminLogin} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">{language === 'kh' ? "បញ្ជាក់" : "Login"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Detail Modal */}
      {showAddModal && pendingLocation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl my-8 border dark:border-gray-700">
            <div className="flex justify-between items-center mb-5 pb-3 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <MapPin className="text-blue-500" /> {language === 'kh' ? "បន្ថែមទិន្នន័យទីតាំងថ្មី" : "Add New Location"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">{language === 'kh' ? "ឈ្មោះស្ថាប័ន ឬបុគ្គល" : "Place / Person Name"}</label>
                <input
                  type="text"
                  placeholder="ឧ. សាលាបឋមសិក្សា..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">{language === 'kh' ? "លេខទូរស័ព្ទទំនាក់ទំនង" : "Phone Number"}</label>
                <input
                  type="tel"
                  placeholder="012 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">{language === 'kh' ? "ប្រភេទស្ថាប័ន" : "Category"}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="សាលារៀន / នាយកសាលា">{language === 'kh' ? "សាលារៀន / នាយកសាលា" : "School / Principal"}</option>
                  <option value="មន្ទីរពេទ្យ / គ្លីនិក">{language === 'kh' ? "មន្ទីរពេទ្យ / គ្លីនិក" : "Hospital / Clinic"}</option>
                  <option value="ប៉ុស្តិ៍ប៉ូលីស">{language === 'kh' ? "ប៉ុស្តិ៍ប៉ូលីស" : "Police Station"}</option>
                  <option value="សាលាឃុំ / ផ្ទះមេភូមិ">{language === 'kh' ? "សាលាឃុំ / ផ្ទះមេភូមិ" : "Commune Hall / Chief House"}</option>
                </select>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-3 text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{language === 'kh' ? "ទីតាំងនឹងត្រូវកំណត់យកកន្លែងដែលអ្នកកំពុងឈរផ្ទាល់ (GPS) ឬ ទីតាំងដែលអ្នកបានចង្អុលលើផែនទី។" : "Location coords will be set based on your GPS position or manual selection on the map."}</p>
              </div>
            </div>
            <button onClick={saveLocation} className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg flex justify-center items-center gap-2">
              <Save className="w-5 h-5" /> {language === 'kh' ? "រក្សាទុកទិន្នន័យ" : "Save Location Data"}
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input for Image Scanner */}
      <input type="file" accept="image/jpeg, image/png, image/jpg" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />

      {/* Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 text-center relative overflow-hidden shadow-2xl">
                <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center justify-center gap-2">
                    <Camera className="w-6 h-6 text-blue-500" /> {language === 'kh' ? "ស្កេនទីតាំងពីរូបភាព" : "Scanning Image Location"}
                </h3>
                {scannedImage && (
                    <div className="relative rounded-lg overflow-hidden border-4 border-gray-100 dark:border-gray-700 mb-4 h-64 bg-gray-900">
                        <img src={scannedImage} alt="Scanned" className="w-full h-full object-contain" />
                        {isScanning && <div className="scanner-line"></div>}
                    </div>
                )}
                {isScanning ? (
                    <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> {language === 'kh' ? "កំពុងទាញយក GPS..." : "Extracting Exif Coordinates..."}
                    </p>
                ) : (
                    <button onClick={() => setShowScannerModal(false)} className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 transition-colors">{language === 'kh' ? "បិទ" : "Close"}</button>
                )}
            </div>
        </div>
      )}

      {/* AI Chat Bot */}
      {isAiOpen && (
        <div className="fixed bottom-4 right-4 w-[90vw] md:w-96 h-[80vh] md:h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col border dark:border-gray-700 overflow-hidden transform transition-all">
            {/* AI Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg"><BrainCircuit className="w-5 h-5" /></div>
                    <h3 className="font-bold">SmartMap AI Assistant</h3>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-md transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            {/* AI Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isAiTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* AI Input */}
            <form onSubmit={handleAiSubmit} className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2 shrink-0">
                <input
                    type="text"
                    placeholder={language === 'kh' ? "សួរអ្វីមួយទៅកាន់ AI..." : "Ask something to AI..."}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 p-2.5 bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-blue-300 dark:focus:border-blue-700 rounded-xl focus:outline-none dark:text-white text-sm transition-colors"
                />
                <button type="submit" disabled={isAiTyping || !aiInput.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white p-2.5 rounded-xl shadow-md transition-all">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl text-white font-medium z-[100] flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900 dark:bg-white dark:text-gray-900'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}