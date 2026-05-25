import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Moon, Sun, Search, X, Save, Trash2, Shield, User, Info, 
  Map as MapIcon, Loader2, Navigation, PhoneCall, Plus, Menu, Eye, 
  EyeOff, AlertCircle, Crosshair
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// 1. Firebase Configuration
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E", // Fallback for dev environment if needed, but should use env var
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "1:1036691345731:web:df8121852c6137e3b35ff6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-map-app-kh'; 

// ចម្ងាយ (Distance Calculator)
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768); 
  const [showDistances, setShowDistances] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [authError, setAuthError] = useState(null); 
  
  // Data States
  const [firebaseLocations, setFirebaseLocations] = useState([]); 
  const [osmLocations, setOsmLocations] = useState([]); 
  const [lastFetchedPos, setLastFetchedPos] = useState(null); 
  const [isFetchingPois, setIsFetchingPois] = useState(false); 

  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null); 
  const [gpsStatus, setGpsStatus] = useState('កំពុងស្វែងរក GPS...'); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const isMapCenteredRef = useRef(false);
  const watchIdRef = useRef(null);
  
  // Ref សម្រាប់ Google Places Autocomplete
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    document.title = "📍 SmartMap";
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("Custom token mismatch, falling back to anonymous auth.");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
        setAuthError(null);
      } catch (error) {
        console.error("Auth error:", error);
        setAuthError(error.message);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    
    // បង្កើត Collection ឈ្មោះ "ramit" ក្នុង Firebase ដើម្បីរក្សាទុកទិន្នន័យ
    const locRef = collection(db, 'artifacts', appId, 'public', 'data', 'ramit');
    const unsub = onSnapshot(locRef, (snapshot) => {
      const locList = [];
      snapshot.forEach(doc => {
        locList.push({ id: doc.id, isAdminData: true, ...doc.data() });
      });
      setFirebaseLocations(locList);
    }, (error) => {
      console.error("Error fetching locations:", error);
    });
    
    return () => unsub();
  }, [authUser]);

  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  ];

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
          const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
          const response = await fetch(url);
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
                      id: `osm-${el.id}`,
                      name: el.tags.name,
                      type: type,
                      lat: el.lat,
                      lng: el.lon,
                      isAdminData: false,
                      keywords: [el.tags.name, type] 
                  };
              });
              
              setOsmLocations(prevOsm => {
                  const newOsmLocations = [...prevOsm];
                  formattedPOIs.forEach(newPoi => {
                      const exists = newOsmLocations.some(existingPoi => 
                          Math.abs(existingPoi.lat - newPoi.lat) < 0.0001 && 
                          Math.abs(existingPoi.lng - newPoi.lng) < 0.0001
                      );
                      if (!exists) {
                          newOsmLocations.push(newPoi);
                      }
                  });
                  return newOsmLocations;
              });
          }
      } catch (error) {
          console.error("Failed to fetch nearby POIs", error);
      } finally {
          setIsFetchingPois(false);
      }
  };

  useEffect(() => {
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYPYMqUNC3FYAuDoTBiJtCCzjZtQd7oCg&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) {
      initializeMap();
    }

    return () => {
        if (watchIdRef.current && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;
    const initialMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 11.5564, lng: 104.9282 }, 
      zoom: 15,
      minZoom: 6, 
      mapTypeControl: true,
      zoomControl: true,
      gestureHandling: 'greedy', 
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
    initialMap.addListener("click", () => { if (infoWindowRef.current) infoWindowRef.current.close(); });

    if (navigator.geolocation) {
       watchIdRef.current = navigator.geolocation.watchPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const userPos = { lat, lng };
          
          setUserLocation(userPos); 
          setGpsStatus('ចាប់បានទីតាំងរបស់អ្នក (Live)');
          
          if (!isMapCenteredRef.current) {
             initialMap.setCenter(userPos);
             initialMap.setZoom(16);
             isMapCenteredRef.current = true;
             fetchNearbyPOIs(lat, lng);
          }
          
          if (userMarkerRef.current) {
              userMarkerRef.current.setPosition(userPos);
          } else {
              userMarkerRef.current = new window.google.maps.Marker({
                 position: userPos,
                 map: initialMap,
                 icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2,
                 },
                 title: "អ្នកកំពុងនៅទីនេះ",
                 zIndex: 999
              });
          }

          setLastFetchedPos(prev => {
              if (!prev || calculateDistance(prev.lat, prev.lng, lat, lng) > 1.0) {
                  fetchNearbyPOIs(lat, lng);
                  return userPos;
              }
              return prev;
          });

       }, (error) => {
          setGpsStatus('មិនអាចចាប់ទីតាំងបាន (សូមបើក GPS)');
       }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
    } else {
       setGpsStatus('ទូរស័ព្ទ/កម្មវិធី មិនគាំទ្រ GPS');
    }

    setMap(initialMap);
  };

  useEffect(() => {
      if (map && window.google && window.google.maps.places && searchInputRef.current && !autocompleteRef.current) {
          
          autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
              fields: ["geometry", "name", "formatted_address"]
          });

          const onPlaceSelected = (place) => {
              if (place.geometry.viewport) {
                  map.fitBounds(place.geometry.viewport);
              } else {
                  map.panTo(place.geometry.location);
                  map.setZoom(16);
              }

              if (tempMarkerRef.current) tempMarkerRef.current.setMap(null);
              tempMarkerRef.current = new window.google.maps.Marker({
                  position: place.geometry.location,
                  map: map,
                  icon: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
                  animation: window.google.maps.Animation.DROP,
                  title: place.name || place.formatted_address
              });
              
              setTimeout(() => {
                  if (tempMarkerRef.current) tempMarkerRef.current.setMap(null);
              }, 5000);

              if (searchInputRef.current) {
                  setSearchQuery(searchInputRef.current.value);
              }
          };

          autocompleteRef.current.addListener("place_changed", () => {
              const place = autocompleteRef.current.getPlace();
              
              if (!place.geometry || !place.geometry.location) {
                  const geocoder = new window.google.maps.Geocoder();
                  geocoder.geocode({ address: searchInputRef.current.value }, (results, status) => {
                      if (status === 'OK' && results && results[0]) {
                          onPlaceSelected(results[0]);
                      } else {
                          showToast("រកមិនឃើញទីតាំងនេះទេ", "error");
                      }
                  });
                  return;
              }

              onPlaceSelected(place);
          });
      }
  }, [map]);

  useEffect(() => {
    if (map && window.google && window.google.maps) {
      map.setOptions({ styles: isDarkMode ? darkMapStyle : [] });
    }
  }, [isDarkMode, map]);

  const allLocationsForMap = useMemo(() => {
      const filteredOsm = osmLocations.filter(osmLoc => {
          const isTooClose = firebaseLocations.some(fbLoc => 
              calculateDistance(osmLoc.lat, osmLoc.lng, fbLoc.lat, fbLoc.lng) < 0.05 
          );
          return !isTooClose;
      });

      return [...firebaseLocations, ...filteredOsm];
  }, [firebaseLocations, osmLocations]);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    markers.forEach(m => {
        if (m && m.marker && typeof m.marker.setMap === 'function') m.marker.setMap(null);
    });
    
    const newMarkers = [];

    allLocationsForMap.forEach(loc => {
      let iconUrl = loc.isAdminData 
          ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" 
          : "http://maps.google.com/mapfiles/ms/icons/purple-dot.png"; 

      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: map,
        title: loc.name,
        icon: iconUrl,
        animation: window.google.maps.Animation.DROP
      });

      marker.addListener("click", () => focusLocation(loc, marker));
      newMarkers.push({ id: loc.id, marker });
    });

    setMarkers(newMarkers);
    
    return () => newMarkers.forEach(m => m.marker?.setMap(null));
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
          return item.keywords.some(k => 
              k && k.toLowerCase().includes(query)
          );
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

  const focusLocation = (loc, markerObj = null) => {
    if (!map || !infoWindowRef.current || !window.google) return;
    const pos = { lat: loc.lat, lng: loc.lng };
    map.panTo(pos);
    map.setZoom(17);
    if(window.innerWidth < 768) setIsSidebarOpen(false); 

    let actualMarker = markerObj || markers.find(m => m.id === loc.id)?.marker;

    if (actualMarker) {
      const formattedDistance = (showDistances && loc.distance !== null && loc.distance !== undefined) ? 
         `<p class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded inline-block shadow-sm">📍 ចម្ងាយ: ${formatDistance(loc.distance)}</p>` : '';
         
      const phoneContent = loc.isAdminData && loc.phone ? `
            <a href="tel:${loc.phone}" class="bg-green-600 hover:bg-green-700 text-white w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md transition-colors mt-2" style="text-decoration: none;">
                <span style="font-size: 1.1rem;">📞</span> ចុចខលឥឡូវនេះ
            </a>
            ` : (!loc.isAdminData ? `<div class="bg-orange-50 border border-orange-100 p-2 rounded mt-2"><p class="text-xs text-orange-600 font-medium">⚠️ មិនទាន់មានទិន្នន័យពី Admin</p></div>` : '');

      const contentString = `
        <div class="p-2 min-w-[220px]">
            <h3 class="font-bold text-lg text-gray-900 mb-1 border-b pb-2 flex items-center gap-1.5">
               ${loc.isAdminData ? '✅' : '📌'} ${loc.name}
            </h3>
            <p class="text-sm font-semibold text-blue-600 mb-2">${loc.type}</p>
            ${formattedDistance}
            ${phoneContent}
        </div>
      `;
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open(map, actualMarker);
    }
  };

  const handleInitiateAddDetail = () => {
    setIsAutoLocating(true);
    if (navigator.geolocation) {
      showToast("កំពុងចាប់យកទីតាំងបច្ចុប្បន្ន...", "success");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setPendingLocation(newPos);
          setFormData({ name: '', phone: '', type: 'សាលារៀន / នាយកសាលា' });
          setIsAutoLocating(false);
          setShowAddModal(true);
          if(map) { map.panTo(newPos); map.setZoom(19); }
        },
        () => {
          setIsAutoLocating(false);
          showToast("សូមបើក GPS ទូរស័ព្ទ!", "error");
        }, { enableHighAccuracy: true }
      );
    }
  };

  const saveLocation = async () => {
    if (!formData.name.trim()) return showToast("សូមបញ្ចូលឈ្មោះស្ថាប័ន ឬបុគ្គល", "error");
    if (!formData.phone.trim()) return showToast("សូមបញ្ចូលលេខទូរស័ព្ទ", "error");
    if (!authUser) return showToast("សូមរង់ចាំការភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេសិន", "error");
    
    const newId = Date.now().toString();
    const newLoc = { 
        ...formData, 
        lat: pendingLocation.lat, 
        lng: pendingLocation.lng, 
        createdAt: Date.now(),
        keywords: [formData.name, formData.type, formData.phone]
    };

    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', newId), newLoc);
        setShowAddModal(false);
        showToast("រក្សាទុកជោគជ័យ!", "success");
    } catch (e) { 
        showToast("Error saving data", "error"); 
    }
  };

  const handleDeleteLocation = async (locId) => {
     try {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ramit', locId));
         showToast("បានលុបទិន្នន័យជោគជ័យ", "success");
     } catch (e) {
         showToast("Error deleting data", "error");
     }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'ict168') { 
        setIsAdmin(true);
        setShowPasswordModal(false);
        setAdminPassword('');
        showToast('ចូលជាអ្នកគ្រប់គ្រងដោយជោគជ័យ!', 'success');
    } else {
        showToast('លេខសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
    }
  }

  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const recenterMap = () => {
    if (map && userLocation) {
        map.panTo(userLocation);
        map.setZoom(16);
    } else {
        showToast("មិនទាន់ស្គាល់ទីតាំងរបស់អ្នកទេ", "error");
    }
  }

  return (
    <div className={`h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'} overflow-hidden`}>
      <style>{`
        /* Google Maps Autocomplete Clean UI */
        .pac-container {
          border-radius: 1rem;
          border: none;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          margin-top: 8px;
          font-family: inherit;
          padding: 8px 0;
          z-index: 9999 !important;
        }
        .pac-item {
          padding: 10px 16px;
          border-top: 1px solid #f3f4f6;
          cursor: pointer;
          font-size: 14px;
        }
        .pac-item:first-child {
          border-top: none;
        }
        .pac-item:hover, .pac-item-selected {
          background-color: #f3f4f6;
        }
        .pac-icon {
          margin-top: 2px;
        }
        /* Dark Mode Support */
        .dark .pac-container {
          background-color: #1f2937;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .dark .pac-item {
          border-top-color: #374151;
          color: #d1d5db;
        }
        .dark .pac-item:hover, .dark .pac-item-selected {
          background-color: #374151;
        }
        .dark .pac-item-query {
          color: #f9fafb;
        }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
        }
      `}</style>
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-20 p-3 flex justify-between items-center relative transition-colors duration-300 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Menu className="w-6 h-6" />
          </button>
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md hidden md:block">
            <MapIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-1 text-gray-800 dark:text-white">📍 SmartMap</h1>
        </div>

        <div className="flex-grow max-w-xs md:max-w-md mx-4 relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ស្វែងរកទីតាំង ទូទាំងពិភពលោក..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); if(searchInputRef.current) searchInputRef.current.value = ''; }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowDistances(!showDistances)} title="បិទ/បើកចម្ងាយ" className={`p-2 rounded-full transition-colors ${showDistances ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
             {showDistances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} title="ប្តូរពណ៌ងងឹត/ភ្លឺ" className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAdmin ? (
            <button onClick={() => setIsAdmin(false)} title="ចាកចេញពី Admin" className="p-2 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 font-bold border border-green-200 dark:border-green-800 transition-colors">
              <Shield className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setShowPasswordModal(true)} title="ចូលជា Admin" className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
            <div 
                className="md:hidden fixed inset-0 bg-black/50 z-20"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}
        
        {/* Sidebar */}
        <aside className={`
            absolute md:relative z-30 h-full bg-white dark:bg-gray-800 shadow-[4px_0_24px_rgba(0,0,0,0.05)] 
            flex flex-col transition-all duration-300 ease-in-out border-r dark:border-gray-700
            ${isSidebarOpen ? 'w-full max-w-[320px] left-0' : '-left-full w-[320px] md:left-0 md:w-0 overflow-hidden'}
        `}>
            {/* Mobile Search - Only visible on small screens when sidebar is open */}
            <div className="md:hidden p-3 border-b dark:border-gray-700">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="ស្វែងរកទីតាំង..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
            </div>

            {isAdmin && (
                <div className="p-3 border-b dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">
                    <button 
                        onClick={handleInitiateAddDetail} 
                        disabled={isAutoLocating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isAutoLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {isAutoLocating ? 'កំពុងចាប់ទីតាំង...' : 'បន្ថែមទីតាំងថ្មីនៅទីនេះ'}
                    </button>
                </div>
            )}

            <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                       <Navigation className="w-4 h-4 text-blue-500" /> ទីតាំងជុំវិញអ្នក
                    </h2>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 py-0.5 px-2 rounded-full font-medium">
                        {filteredAndSortedLocations.length} ទីតាំង
                    </span>
                </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/20">
                {isFetchingPois && (
                    <div className="flex items-center justify-center gap-2 p-4 text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">កំពុងស្វែងរកទីតាំងជុំវិញ...</span>
                    </div>
                )}
                
                {filteredAndSortedLocations.length === 0 && !isFetchingPois ? (
                    <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>មិនមានទីតាំងទេ</p>
                    </div>
                ) : (
                    filteredAndSortedLocations.map((loc) => (
                        <div 
                            key={loc.id}
                            onClick={() => focusLocation(loc)}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg shrink-0 ${loc.isAdminData ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                                        {loc.isAdminData ? <Shield className="w-5 h-5 text-green-600 dark:text-green-400" /> : <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{loc.name}</h3>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{loc.type}</p>
                                        
                                        {showDistances && loc.distance !== null && loc.distance !== undefined && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                                                <Navigation className="w-3 h-3" /> ចម្ងាយ: {formatDistance(loc.distance)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {isAdmin && loc.isAdminData && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                                        title="លុបទីតាំងនេះ"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {loc.isAdminData && loc.phone && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <PhoneCall className="w-3.5 h-3.5" /> {loc.phone}
                                    </span>
                                    <a 
                                        href={`tel:${loc.phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-800 px-3 py-1.5 rounded-full font-bold transition-colors"
                                    >
                                        ខលឥឡូវនេះ
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </aside>

        {}
        <main className="flex-1 relative z-10 bg-gray-200 dark:bg-gray-800 h-full w-full">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />
            
            {/* GPS Status Overlay */}
            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200/50 dark:border-gray-700/50">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${userLocation ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${userLocation ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 pointer-events-auto">
                        {gpsStatus}
                    </span>
                </div>
            </div>

            {/* Recenter Button */}
            <button 
                onClick={recenterMap}
                className="absolute bottom-6 right-6 z-20 bg-white dark:bg-gray-800 p-3 rounded-full shadow-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 transition-transform active:scale-95"
                title="ត្រលប់ទៅទីតាំងខ្ញុំ"
            >
                <Crosshair className="w-6 h-6" />
            </button>
        </main>
      </div>

      {}
      {/* Add Details Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border dark:border-gray-700 overflow-hidden transform transition-all">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> បន្ថែមព័ត៌មានលម្អិត
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-5 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs p-3 rounded-lg flex gap-2 items-start border border-blue-100 dark:border-blue-800">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>ទីតាំងត្រូវបានកំណត់ដោយស្វ័យប្រវត្តិ។ សូមបញ្ចូលព័ត៌មានខាងក្រោម។</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">ឈ្មោះស្ថាប័ន ឬបុគ្គល *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="ឧ. សាលាបឋមសិក្សា..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">លេខទូរស័ព្ទ *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="012 345 678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">ប្រភេទ *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="សាលារៀន / នាយកសាលា">សាលារៀន / នាយកសាលា</option>
                    <option value="មន្ទីរពេទ្យ / គ្លីនិក / គ្រូពេទ្យ">មន្ទីរពេទ្យ / គ្លីនិក / គ្រូពេទ្យ</option>
                    <option value="ប៉ុស្តិ៍ប៉ូលីស / មេប៉ុស្តិ៍">ប៉ុស្តិ៍ប៉ូលីស / មេប៉ុស្តិ៍</option>
                    <option value="សាលាឃុំ / មេឃុំ">សាលាឃុំ / មេឃុំ</option>
                    <option value="សាលាស្រុក / អភិបាលស្រុក">សាលាស្រុក / អភិបាលស្រុក</option>
                    <option value="មេភូមិ / អនុភូមិ">មេភូមិ / អនុភូមិ</option>
                    <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                  </select>
                </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3 justify-end rounded-b-2xl">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                បោះបង់
              </button>
              <button 
                onClick={saveLocation}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" /> រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all">
            <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">ផ្ទៀងផ្ទាត់សិទ្ធិ (Admin)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">សូមបញ្ចូលពាក្យសម្ងាត់ដើម្បីបន្ថែម ឬកែប្រែទិន្នន័យ</p>
                
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="ពាក្យសម្ងាត់..."
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center text-lg tracking-wider bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  autoFocus
                />
            </div>
            <div className="flex border-t dark:border-gray-700">
              <button 
                onClick={() => { setShowPasswordModal(false); setAdminPassword(''); }}
                className="flex-1 p-4 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors"
              >
                បោះបង់
              </button>
              <button 
                onClick={handleAdminLogin}
                className="flex-1 p-4 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l dark:border-gray-700 transition-colors"
              >
                យល់ព្រម
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
            <div className={`px-4 py-2.5 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
                {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {toast.message}
            </div>
        </div>
      )}
    </div>
  );
}