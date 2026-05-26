import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Moon, Sun, Search, X, Save, Trash2, Shield, User, Info, 
  Map as MapIcon, Loader2, Navigation, PhoneCall, Plus, 
  AlertCircle, Crosshair, 
  UserCircle, Globe, Activity, ShieldAlert, Users, TrendingUp,
  Eye, EyeOff, WifiOff, Clock, BarChart3
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [adminTab, setAdminTab] = useState('locations'); 
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);

  const [showDistances, setShowDistances] = useState(true);
  
  const [firebaseLocations, setFirebaseLocations] = useState([]); 
  const [osmLocations, setOsmLocations] = useState([]); 
  const [isFetchingPois, setIsFetchingPois] = useState(false); 
  const [gpsStatus, setGpsStatus] = useState('');

  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const watchIdRef = useRef(null);
  const profileMenuRef = useRef(null);
  const isMapCenteredRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const cachedLocs = localStorage.getItem('offline_contacts');
    if (cachedLocs) setFirebaseLocations(JSON.parse(cachedLocs));

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dark Mode Logic
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (map) map.setOptions({ styles: darkMapStyle });
    } else {
      document.documentElement.classList.remove('dark');
      if (map) map.setOptions({ styles: [] });
    }
  }, [isDarkMode, map]);

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
      } catch (error) { console.error("Auth error"); }
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
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
      } catch (e) { }
  };

  const getClientIP = async () => {
      try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          return data.ip;
      } catch (e) { return 'Unknown IP'; }
  };

  // Firebase Real-time Listeners
  useEffect(() => {
    if (!authUser) return;
    const locRef = collection(db, 'artifacts', appId, 'public', 'data', 'ramit');
    const unsubLoc = onSnapshot(locRef, (snapshot) => {
      const locList = [];
      snapshot.forEach(doc => locList.push({ id: doc.id, isAdminData: true, ...doc.data() }));
      setFirebaseLocations(locList);
      localStorage.setItem('offline_contacts', JSON.stringify(locList));
    }, (error) => console.warn("Location fetch issue."));
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

  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ];

  // Auto Fetch POIs (Radius: 5km) Real location randomizer
  const fetchNearbyPOIs = async (lat, lng) => {
      if (isOffline) return;
      setIsFetchingPois(true);
      try {
          const query = `
              [out:json][timeout:25];
              (
                node["amenity"~"school|kindergarten|college|university|hospital|clinic|doctors|pharmacy|police|fire_station"](around:5000,${lat},${lng});
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
          
          if (!response.ok) throw new Error(`HTTP Error`);
          const data = await response.json();
          
          if (data && data.elements) {
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
          }
      } catch (error) { 
          console.warn("POI Fetching Failed");
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
    if (!mapRef.current || !window.google || !window.google.maps) return;
    try { await window.google.maps.importLibrary("marker"); } catch (e) {}

    const initialCenter = { lat: 11.5564, lng: 104.9282 };
    const initialMap = new window.google.maps.Map(mapRef.current, {
      center: initialCenter, zoom: 15, minZoom: 6, mapTypeControl: false, zoomControl: true, 
      zoomControlOptions: { position: window.google.maps.ControlPosition.LEFT_CENTER },
      gestureHandling: 'greedy', mapId: "450ae928a2c49128",
      styles: isDarkMode ? darkMapStyle : []
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
    initialMap.addListener("click", () => { if (infoWindowRef.current) infoWindowRef.current.close(); });

    // Set up Google Places Autocomplete (Khmer Supported Search)
    if (searchInputRef.current && !autocompleteRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'name', 'formatted_address']
        });
        
        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                
                initialMap.panTo(place.geometry.location);
                initialMap.setZoom(16);
                
                if (tempMarkerRef.current) tempMarkerRef.current.map = null;
                if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
                    const searchPin = document.createElement('div');
                    searchPin.innerHTML = `<div class="text-4xl filter drop-shadow-lg pb-4 animate-bounce">📍</div>`;
                    tempMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ position: {lat, lng}, map: initialMap, content: searchPin, title: place.name });
                    setTimeout(() => { if (tempMarkerRef.current) tempMarkerRef.current.map = null; }, 8000);
                }
                fetchNearbyPOIs(lat, lng);
            }
        });
    }

    // LIVE GPS TRACKING (Pan Map Auto)
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(userPos);
          setGpsStatus('ចាប់បានទីតាំងជោគជ័យ (Live)');

          if (initialMap && !isMapCenteredRef.current) {
            initialMap.panTo(userPos);
            initialMap.setZoom(16);
            isMapCenteredRef.current = true;
            fetchNearbyPOIs(userPos.lat, userPos.lng);
          }

          if (userMarkerRef.current) {
            userMarkerRef.current.position = userPos;
          } else {
            const userPin = document.createElement("div");
            userPin.innerHTML = `<div style="width:18px; height:18px; background:#3b82f6; border:3px solid white; border-radius:50%; box-shadow:0 0 12px rgba(59,130,246,0.8);"></div>`;
            if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
              userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: initialMap, position: userPos, content: userPin, title: "អ្នកកំពុងនៅទីនេះ" });
            }
          }
        },
        (error) => { setGpsStatus('សូមបើក GPS ដើម្បីមើលទីតាំងផ្ទាល់'); },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
      );
    } else {
        setGpsStatus('ទូរស័ព្ទមិនគាំទ្រ GPS');
    }
    setMap(initialMap);
  };

  const allLocationsForMap = useMemo(() => {
    if (!firebaseLocations || !osmLocations) return [];
    // Filter out OSM data that is too close to Admin Data (merge)
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
        pinElement.innerHTML = `<div class="flex flex-col items-center"><div class="bg-green-500 text-white p-1.5 rounded-full border border-white shadow-md flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg></div><div class="w-1.5 h-1.5 bg-green-500 rounded-full -mt-0.5 border border-white shadow-sm"></div></div>`;
      } else {
        pinElement.innerHTML = `<div class="flex flex-col items-center"><div class="bg-indigo-500 text-white p-1.5 rounded-full border border-white shadow-md flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div></div>`;
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
          return { ...loc, distance };
      });

      return mappedLocs.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
      });
  }, [allLocationsForMap, userLocation]);

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
      const phoneContent = loc.isAdminData && loc.phone ? `
            <div class="mt-2 pt-2 border-t border-gray-200">
                <a href="tel:${loc.phone}" class="bg-green-600 hover:bg-green-700 text-white w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md transition-colors mt-1" style="text-decoration: none;">
                    <span style="font-size: 1rem;">📞</span> ខលទំនាក់ទំនង
                </a>
                <p class="text-center text-xs mt-1 text-gray-500">${loc.phone}</p>
            </div>
            ` : (!loc.isAdminData ? `<div class="bg-red-50 border border-red-200 p-1.5 rounded mt-2 text-center"><p class="text-xs text-red-600 font-bold">NO ! មិនទាន់មានទិន្នន័យ</p></div>` : '');

      const contentString = `
        <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-base text-gray-900 mb-1 flex items-start gap-1.5 font-sans">
               ${loc.isAdminData ? '✅' : '📌'} ${loc.name}
            </h3>
            <p class="text-xs font-semibold text-blue-600 mb-1 font-sans">${loc.type}</p>
            ${phoneContent}
        </div>
      `;
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open({ anchor: actualMarker, map, shouldFocus: true });
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
        (error) => { setIsAutoLocating(false); showToast("សូមបើក GPS ទូរស័ព្ទ!", "error"); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const saveLocation = async () => {
    if (!formData.name.trim()) return showToast("សូមបញ្ចូលឈ្មោះស្ថាប័ន ឬបុគ្គល", "error");
    if (!formData.phone.trim()) return showToast("សូមបញ្ចូលលេខទូរស័ព្ទ", "error");
    if (!authUser) return showToast("សូមរង់ចាំការភ្ជាប់...", "error");
    
    const newId = Date.now().toString();
    const newLoc = { 
        ...formData, lat: pendingLocation.lat, lng: pendingLocation.lng, 
        createdAt: Date.now(), keywords: [formData.name, formData.type, formData.phone]
    };

    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), newLoc);
        setShowAddModal(false); showToast("រក្សាទុកជោគជ័យ!", "success");
    } catch (e) { 
        showToast("បរាជ័យក្នុងការរក្សាទុក", "error");
    }
  };

  const handleDeleteLocation = async (locId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', locId));
         showToast("បានលុបជោគជ័យ", "success");
     } catch (e) { showToast("មិនអាចលុបបានទេ", "error"); }
  };

  // High Security Admin Login & IP Grabber
  const handleAdminLogin = async () => {
    if (adminPassword === 'ict168mit') { 
        setIsAdmin(true); setShowPasswordModal(false); setAdminPassword('');
        showToast('ចូលជាអ្នកគ្រប់គ្រងដោយជោគជ័យ!', 'success');
    } else { 
        showToast('លេខសម្ងាត់មិនត្រឹមត្រូវ!', 'error'); 
        if (authUser) {
            try {
                const ip = await getClientIP();
                const secId = Date.now().toString();
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', secId), {
                    timestamp: Date.now(), 
                    attemptedTime: new Date().toLocaleString(),
                    lat: userLocation ? userLocation.lat : null, 
                    lng: userLocation ? userLocation.lng : null,
                    ipAddress: ip,
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
    }
  }

  const totalUsers = visitorLogs.length;
  const now = Date.now();
  
  // Calculate active users in different timeframes
  const active24h = visitorLogs.filter(log => (now - log.timestamp) < 86400000).length;
  const active7d = visitorLogs.filter(log => (now - log.timestamp) < 86400000 * 7).length;
  const active30d = visitorLogs.filter(log => (now - log.timestamp) < 86400000 * 30).length;
  const active1y = visitorLogs.filter(log => (now - log.timestamp) < 86400000 * 365).length;
  
  const growthPercentage = totalUsers > 0 ? Math.round((active24h / totalUsers) * 100) : 0;

  // Render Charts Function
  const renderBarChart = (value, max, label, color) => {
      const percentage = max > 0 ? (value / max) * 100 : 0;
      return (
          <div className="mb-3">
              <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-gray-600 dark:text-gray-300">{label}</span>
                  <span className={`text-${color}-600 dark:text-${color}-400`}>{value} នាក់</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className={`bg-${color}-500 h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
              </div>
          </div>
      );
  }

  return (
    <div className={`h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'} overflow-hidden`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
        .pac-container { border-radius: 12px; margin-top: 5px; border: none; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 5px 0; z-index: 9999; }
        .pac-item { padding: 8px 12px; font-family: inherit; font-size: 14px; cursor: pointer; border-top: none; }
        .pac-item:hover { background-color: #f3f4f6; }
        .dark .pac-container { background-color: #1f2937; }
        .dark .pac-item { color: #f3f4f6; }
        .dark .pac-item:hover { background-color: #374151; }
        .dark .pac-item-query { color: #93c5fd; }
      `}</style>
      
      {/* Smart Mobile Header - Wrapped beautifully */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-20 p-2.5 md:p-3 relative transition-colors duration-300 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-1.5 md:p-2 rounded-lg shadow-md">
              <MapIcon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h1 className="text-base md:text-xl font-extrabold flex items-center gap-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">SmartMap</h1>
            {isOffline && (
              <span className="ml-1 bg-red-100 text-red-600 text-[10px] md:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <WifiOff className="w-3 h-3" /> <span className="hidden sm:inline">Offline Mode</span>
              </span>
            )}
          </div>

          {/* Action Buttons (Right side on Mobile/Desktop) */}
          <div className="flex gap-1.5 md:gap-2 shrink-0 items-center order-2 md:order-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 md:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={`p-1 border-2 rounded-full transition-all ${isAdmin ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-600'} hover:bg-gray-100 dark:hover:bg-gray-700`}>
                    {isAdmin ? <Shield className="w-5 h-5 md:w-6 md:h-6" /> : <UserCircle className="w-5 h-5 md:w-6 md:h-6" />}
                </button>

                {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-2 animate-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1 bg-gray-50 dark:bg-gray-900/50">
                            <p className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                                {isAdmin ? <Shield className="w-4 h-4 text-green-500"/> : <User className="w-4 h-4 text-blue-500"/>}
                                {isAdmin ? 'គណនី Admin' : 'គណនីអ្នកប្រើប្រាស់'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{isAdmin ? 'សិទ្ធិគ្រប់គ្រងពេញលេញ' : 'ទិដ្ឋភាពទូទៅ'}</p>
                        </div>
                        
                        <button onClick={() => setLanguage(language === 'kh' ? 'en' : 'kh')} className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-3 dark:text-gray-200 transition-colors font-medium">
                            <Globe className="w-4 h-4 text-blue-500" /> ប្តូរភាសា (Lang)
                        </button>
                        
                        {!isAdmin ? (
                            <button onClick={() => {setShowProfileMenu(false); setShowPasswordModal(true);}} className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold transition-colors">
                                <Shield className="w-4 h-4" /> Access Admin
                            </button>
                        ) : (
                            <button onClick={() => {setIsAdmin(false); setShowProfileMenu(false); setAdminTab('locations');}} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 text-red-600 dark:text-red-400 font-bold border-t border-gray-100 dark:border-gray-700 mt-1 transition-colors">
                                <User className="w-4 h-4" /> ចាកចេញពី Admin
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>

          {/* Search Box - Wraps to new line on mobile, stays in middle on desktop */}
          <div className="w-full md:w-auto md:flex-grow md:max-w-md mx-auto relative order-3 md:order-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ស្វែងរក ភូមិ ឃុំ ស្រុក (Google Maps)..."
              className="block w-full pl-9 md:pl-10 pr-3 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-900 text-[13px] md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white shadow-sm"
            />
          </div>

        </div>
      </header>

      {/* Main Content: Flex column reverse puts Map on Top, Sidebar on Bottom for Mobile */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">
        
        {/* Sidebar / Bottom Sheet */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-gray-800 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] md:shadow-[2px_0_15px_rgba(0,0,0,0.1)] z-10 transition-all duration-300 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 h-[45%] md:h-full shrink-0">
          
          {/* Admin Tabs */}
          {isAdmin && (
             <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-900">
                 <button onClick={() => setAdminTab('locations')} className={`flex-1 py-3 text-[13px] font-bold flex justify-center items-center gap-1.5 transition-all ${adminTab === 'locations' ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'}`}>
                    <Navigation className="w-3.5 h-3.5" /> ទីតាំង
                 </button>
                 <button onClick={() => setAdminTab('reports')} className={`flex-1 py-3 text-[13px] font-bold flex justify-center items-center gap-1.5 transition-all ${adminTab === 'reports' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'}`}>
                    <BarChart3 className="w-3.5 h-3.5" /> របាយការណ៍
                 </button>
             </div>
          )}

          {adminTab === 'locations' ? (
              <>
                  {/* ADMIN ADD BUTTON */}
                  {isAdmin && (
                      <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10 shrink-0">
                         <button onClick={handleInitiateAddDetail} className="w-full py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex justify-center items-center gap-2 transition-all active:scale-95 text-[13px] md:text-sm">
                            <Plus className="w-4 h-4 md:w-5 md:h-5" /> បន្ថែមព័ត៌មានលម្អិតទីតាំង
                         </button>
                      </div>
                  )}

                  <div className="p-2.5 md:p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
                     <div className="flex justify-between items-center mb-1">
                         <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5 text-[13px] uppercase tracking-wide">
                            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> ទីតាំងជុំវិញ
                         </h2>
                         <button onClick={() => setShowDistances(!showDistances)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="បង្ហាញចម្ងាយ">
                            {showDistances ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                         </button>
                     </div>
                     {gpsStatus && (
                        <div className={`text-[10px] md:text-[11px] px-2 py-1 md:py-1.5 rounded-lg font-bold border ${userLocation ? 'text-green-700 bg-green-100 border-green-300 dark:bg-green-900/30 dark:text-green-400' : 'text-orange-700 bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400'} flex items-center gap-1.5`}>
                           {userLocation ? <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span></span> : '⚠️'} {gpsStatus}
                        </div>
                     )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 md:p-3 space-y-2.5 md:space-y-3 bg-gray-50/30 dark:bg-gray-900/30">
                     {filteredAndSortedLocations.map((loc) => (
                       <div key={loc.id} onClick={() => focusLocation(loc)} className={`bg-white dark:bg-gray-800 border ${loc.isAdminData ? 'border-l-4 border-l-green-500 border-y-green-100 border-r-green-100 dark:border-green-800 shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm'} p-3 md:p-3.5 rounded-xl hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden`}>
                         <div className="flex justify-between items-start mb-1.5 md:mb-2">
                           <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-start gap-1.5 text-[14px] md:text-[15px] pr-6">
                             {loc.isAdminData ? <span title="ទិន្នន័យ Admin" className="text-green-500 shrink-0">✅</span> : <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 text-gray-400 shrink-0" />}
                             <span className="line-clamp-2 leading-tight">{loc.name}</span>
                           </h3>
                           {isAdmin && loc.isAdminData && (
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }} className="absolute top-1 right-1 md:top-2 md:right-2 text-gray-300 hover:text-red-500 p-1 md:p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="លុបទីតាំង">
                               <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                             </button>
                           )}
                         </div>
                         
                         <div className="flex items-center gap-1.5 mb-1.5 md:mb-2 flex-wrap">
                           <span className="text-[10px] md:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                             {loc.type}
                           </span>
                           {showDistances && loc.distance !== null && loc.distance !== undefined && (
                              <span className="text-[10px] md:text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                 <Navigation className="w-2.5 h-2.5 md:w-3 md:h-3" /> {formatDistance(loc.distance)}
                              </span>
                           )}
                         </div>

                         {loc.isAdminData && loc.phone ? (
                           <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-100 dark:border-gray-700">
                             <a href={`tel:${loc.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-1.5 w-full py-1.5 md:py-2 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white dark:bg-green-900/20 dark:hover:bg-green-600 dark:text-green-400 dark:hover:text-white text-[12px] md:text-sm font-bold rounded-lg transition-colors border border-green-200 dark:border-green-800">
                               <PhoneCall className="w-3.5 h-3.5 md:w-4 md:h-4" /> លេខ: {loc.phone}
                             </a>
                           </div>
                         ) : (
                           <div className="mt-1 md:mt-2 flex items-center">
                              <span className="text-[9px] md:text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900">NO ! មិនទាន់មានទិន្នន័យលម្អិត</span>
                           </div>
                         )}
                       </div>
                     ))}
                  </div>
              </>
          ) : (
              // Reports Dashboard Tab (Admin Only)
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 bg-gray-50 dark:bg-gray-900">
                  
                  {/* Stats Cards */}
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2.5 md:mb-3 flex items-center gap-2 text-[13px] md:text-sm uppercase tracking-wide">
                      <BarChart3 className="w-4 h-4 text-blue-500" /> ស្ថិតិអ្នកប្រើប្រាស់
                  </h3>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-5 md:mb-6">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                         <div className="flex items-center gap-2 text-gray-500">
                            <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                            <span className="text-[11px] md:text-sm font-bold">សរុប (Total)</span>
                         </div>
                         <div className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{totalUsers}</div>
                      </div>
                      
                      <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
                          {renderBarChart(active24h, totalUsers, "២៤ម៉ោងចុងក្រោយ", "blue")}
                          {renderBarChart(active7d, totalUsers, "ប្រចាំសប្តាហ៍", "indigo")}
                          {renderBarChart(active30d, totalUsers, "ប្រចាំខែ", "emerald")}
                          {renderBarChart(active1y, totalUsers, "ប្រចាំឆ្នាំ", "amber")}
                      </div>
                  </div>

                  {/* Security Section */}
                  <div className="mb-5 md:mb-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-2.5 md:mb-3 flex items-center gap-2 text-[13px] md:text-sm uppercase tracking-wide">
                         <ShieldAlert className="w-4 h-4 text-red-500" /> កំណត់ត្រាសុវត្ថិភាព (Security)
                      </h3>
                      {securityLogs.length === 0 ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 md:p-4 rounded-xl text-center">
                              <Shield className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-1.5 md:mb-2 opacity-50" />
                              <p className="text-[11px] md:text-sm text-green-700 dark:text-green-400 font-bold">មានសុវត្ថិភាពល្អ មិនមានការលួចចូលទេ</p>
                          </div>
                      ) : (
                          <div className="space-y-2 md:space-y-3">
                              {securityLogs.map(log => (
                                  <div key={log.id} className="bg-white dark:bg-gray-800 border-l-4 border-l-red-500 border-y-red-100 border-r-red-100 dark:border-gray-700 p-2.5 md:p-3.5 rounded-xl shadow-sm relative overflow-hidden">
                                      <p className="text-red-600 dark:text-red-400 font-bold text-[11px] md:text-xs mb-1.5 md:mb-2 flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" /> ការប៉ុនប៉ងចូលខុសច្បាប់
                                      </p>
                                      <p className="text-gray-700 dark:text-gray-300 text-[10px] md:text-xs mb-1"><span className="font-semibold">ម៉ោង:</span> {log.attemptedTime}</p>
                                      <p className="text-gray-700 dark:text-gray-300 text-[10px] md:text-xs mb-1"><span className="font-semibold">IP Address:</span> <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{log.ipAddress || 'Unknown'}</span></p>
                                      <p className="text-gray-700 dark:text-gray-300 text-[10px] md:text-xs mb-1"><span className="font-semibold">GPS:</span> <span className="font-mono">{log.lat ? `${log.lat.toFixed(4)}, ${log.lng.toFixed(4)}` : 'Unknown'}</span></p>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>

        {/* Map Container - Flex 1 handles taking the rest of space */}
        <div className="flex-1 relative h-[55%] md:h-full bg-gray-100 dark:bg-gray-800 z-0">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Target Button - Adjusted position to be clear from sidebar and map UI */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col gap-2 z-10">
            <button onClick={recenterMap} title="ត្រលប់មកទីតាំងខ្ញុំវិញ" className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 p-3 md:p-3.5 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 group relative">
              <Crosshair className="w-5 h-5 md:w-6 md:h-6 group-hover:animate-spin-slow" />
            </button>
          </div>
        </div>

      </div>

      {/* Clean Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center mb-5 md:mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3.5 md:p-4 rounded-full text-blue-600 dark:text-blue-400 mb-2.5 md:mb-3 shadow-inner">
                 <Shield className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">Admin Access</h3>
              <p className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400 mt-1">ទាមទារសិទ្ធិគ្រប់គ្រង</p>
            </div>
            
            <div className="relative mb-5 md:mb-6">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 md:py-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all text-center tracking-[0.5em] text-xl md:text-2xl font-black shadow-inner"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                  autoFocus
                />
            </div>

            <div className="flex gap-2.5 md:gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 md:py-3.5 text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-bold transition-colors shadow-sm text-sm">បោះបង់</button>
              <button onClick={handleAdminLogin} className="flex-1 py-3 md:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold transition-transform active:scale-95 text-sm">ចូលប្រព័ន្ធ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Detail Modal */}
      {showAddModal && pendingLocation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-3xl w-full max-w-md shadow-2xl my-8 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-5 md:mb-6 pb-3 md:pb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 md:p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                បន្ថែមព័ត៌មានទីតាំង
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-1.5 md:p-2 rounded-full transition-colors">
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 md:mb-2">ឈ្មោះស្ថាប័ន ឬបុគ្គល</label>
                <input
                  type="text"
                  placeholder="ឧ. សាលាបឋមសិក្សា ឬ លោកនាយក..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 md:p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-shadow shadow-inner text-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 md:mb-2">លេខទូរស័ព្ទទំនាក់ទំនង</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-3.5 flex items-center pointer-events-none">
                        <PhoneCall className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="012 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-10 md:pl-11 pr-3 md:pr-3.5 py-3 md:py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-shadow shadow-inner font-mono font-medium text-sm"
                    />
                </div>
              </div>
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 md:mb-2">ប្រភេទស្ថាប័ន</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-3 md:p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-shadow shadow-inner appearance-none cursor-pointer font-medium text-sm"
                >
                  <option value="សាលារៀន / នាយកសាលា">🏫 សាលារៀន / នាយកសាលា</option>
                  <option value="មន្ទីរពេទ្យ / គ្លីនិក">🏥 មន្ទីរពេទ្យ / គ្លីនិក</option>
                  <option value="ប៉ុស្តិ៍ប៉ូលីស">👮 ប៉ុស្តិ៍ប៉ូលីស</option>
                  <option value="សាលាឃុំ / ផ្ទះមេភូមិ">🏛️ សាលាឃុំ / ផ្ទះមេភូមិ</option>
                </select>
              </div>
            </div>
            
            <button onClick={saveLocation} className="w-full mt-6 md:mt-8 py-3 md:py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.39)] flex justify-center items-center gap-2 transition-all active:scale-95 text-[15px] md:text-lg">
              <Save className="w-4 h-4 md:w-5 md:h-5" /> រក្សាទុកទិន្នន័យ
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-5 py-2.5 md:px-6 md:py-3.5 rounded-full shadow-2xl text-white font-bold z-[150] flex items-center gap-2 transition-all animate-in slide-in-from-bottom-5 text-xs md:text-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900 dark:bg-white dark:text-gray-900'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 md:w-5 md:h-5" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}