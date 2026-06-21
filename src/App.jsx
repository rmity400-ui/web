import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
  LogOut, Settings, Activity, Users, MapPin, TrendingUp
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc 
} from 'firebase/firestore';

// --- Configuration & Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'khmer-explorer-app';

// --- Shared Styles Injection ---
const injectStyles = () => {
  const styleId = 'khmer-app-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap');
      
      :root {
        --font-khmer: 'Noto Sans Khmer', sans-serif;
      }
      
      .font-khmer { font-family: var(--font-khmer); }
      
      .glass-panel {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      .dark .glass-panel {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      .soft-shadow {
        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
      }
      .dark .soft-shadow {
        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(style);
  }
};

// --- Mock Initial Data (if db is empty) ---
const INITIAL_LOCATIONS = [
  { id: '1', title: 'ប្រាសាទអង្គរវត្ត', desc: 'ប្រាសាទអង្គរវត្ត គឺជាអច្ឆរិយវត្ថុដ៏អស្ចារ្យបំផុតនៅលើពិភពលោក។ (Angkor Wat is a magnificent wonder.)', image: 'https://images.unsplash.com/photo-1600588636254-2070ed3f30db?auto=format&fit=crop&w=800&q=80', category: 'Temple', status: 'approved', likes: 1240, authorId: 'admin' },
  { id: '2', title: 'កោះរ៉ុង', desc: 'កោះរ៉ុងមានឆ្នេរខ្សាច់សក្បុស និងទឹកសមុទ្រថ្លាឈ្វេង។ (Koh Rong has pristine white beaches and clear water.)', image: 'https://images.unsplash.com/photo-1596484552834-6a58f850d0fa?auto=format&fit=crop&w=800&q=80', category: 'Island', status: 'approved', likes: 850, authorId: 'admin' },
  { id: '3', title: 'ភ្នំបូកគោ', desc: 'ឧទ្យានជាតិព្រះមុនីវង្សបូកគោ មានអាកាសធាតុត្រជាក់ពេញមួយឆ្នាំ។ (Bokor National Park offers cool weather all year.)', image: 'https://images.unsplash.com/photo-1544806655-242ba4eaf816?auto=format&fit=crop&w=800&q=80', category: 'Mountain', status: 'pending', likes: 320, authorId: 'user1' },
];

// --- Main Application Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Global State
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Simplified admin check
  
  // Data State
  const [locations, setLocations] = useState([]);
  const [chats, setChats] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'សូមស្វាគមន៍មកកាន់កម្មវិធី! (Welcome to the app!)', read: false },
    { id: 2, text: 'ទីតាំងថ្មីត្រូវបានបន្ថែម។ (A new location was added.)', read: true }
  ]);

  // Modals & Overlays
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Initialize Auth & Theme
  useEffect(() => {
    injectStyles();
    
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Mock Admin Logic for demo (in production, check a user role document)
      if (currentUser) setIsAdmin(true); 
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    // 1. Locations (Public Data)
    const locationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'locations');
    const unsubLocations = onSnapshot(locationsRef, (snapshot) => {
      let locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (locs.length === 0) {
        // Seed data if empty
        INITIAL_LOCATIONS.forEach(loc => {
          setDoc(doc(locationsRef, loc.id), loc);
        });
        locs = INITIAL_LOCATIONS;
      }
      setLocations(locs);
    }, (err) => console.error(err));

    // 2. Chats (Public Data)
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const unsubChats = onSnapshot(chatsRef, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory (Rule 2: No complex queries)
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setChats(msgs);
    }, (err) => console.error(err));

    // 3. User Favorites (Private Data)
    const favRef = collection(db, 'artifacts', appId, 'users', user.uid, 'favorites');
    const unsubFavs = onSnapshot(favRef, (snapshot) => {
      const favMap = {};
      snapshot.docs.forEach(doc => { favMap[doc.id] = true; });
      setFavorites(favMap);
    }, (err) => console.error(err));

    return () => {
      unsubLocations();
      unsubChats();
      unsubFavs();
    };
  }, [user]);

  // Global Handlers
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  const toggleFavorite = async (locationId) => {
    if (!user) return;
    const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', locationId);
    if (favorites[locationId]) {
      await deleteDoc(favDocRef);
    } else {
      await setDoc(favDocRef, { timestamp: Date.now() });
    }
  };

  // Helper function to process data safely
  const approvedLocations = useMemo(() => locations.filter(l => l.status === 'approved'), [locations]);
  const pendingLocations = useMemo(() => locations.filter(l => l.status === 'pending'), [locations]);

  if (isAuthLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen flex selection:bg-indigo-500 selection:text-white">
        
        {/* Desktop Sidebar */}
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Top Navigation */}
          <TopBar 
            theme={theme} 
            toggleTheme={toggleTheme} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            notifications={notifications}
            user={user}
          />

          {/* Dynamic View Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {currentView === 'home' && (
              <HomeView 
                locations={approvedLocations} 
                searchQuery={searchQuery}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onOpenLocation={setSelectedLocation}
              />
            )}
            {currentView === 'explore' && (
               <ExploreView 
               locations={approvedLocations} 
               searchQuery={searchQuery}
               favorites={favorites}
               toggleFavorite={toggleFavorite}
               onOpenLocation={setSelectedLocation}
             />
            )}
            {currentView === 'chat' && (
              <ChatView chats={chats} user={user} />
            )}
            {currentView === 'admin' && isAdmin && (
              <AdminDashboard 
                locations={locations} 
                pendingLocations={pendingLocations} 
              />
            )}
            {currentView === 'profile' && (
              <ProfileView 
                user={user} 
                favorites={favorites} 
                locations={approvedLocations} 
                onOpenLocation={setSelectedLocation}
              />
            )}
          </div>
          
          {/* Mobile Bottom Navigation */}
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />

        </main>

        {/* Modals */}
        {selectedLocation && (
          <LocationDetailModal 
            location={selectedLocation} 
            onClose={() => setSelectedLocation(null)} 
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}

      </div>
    </div>
  );
}

// ==========================================
// VIEWS & COMPONENTS
// ==========================================

const Sidebar = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម', sub: 'Home' },
    { id: 'explore', icon: Map, label: 'រុករក', sub: 'Explore' },
    { id: 'chat', icon: MessageCircle, label: 'សហគមន៍', sub: 'Community' },
    { id: 'profile', icon: User, label: 'គណនី', sub: 'Profile' },
  ];

  if (isAdmin) navItems.splice(3, 0, { id: 'admin', icon: ShieldCheck, label: 'អ្នកគ្រប់គ្រង', sub: 'Admin' });

  return (
    <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-200 dark:border-slate-800 z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
          <MapPin className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">Khmer Explorer</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">ស្វែងយល់ពីកម្ពុជា</p>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-4 px-3 uppercase tracking-wider">ម៉ឺនុយ (Menu)</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
              currentView === item.id 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentView === item.id ? 'stroke-[2.5px]' : ''}`} />
            <div className="text-left">
              <div className="font-medium">{item.label}</div>
              <div className="text-[10px] opacity-60 leading-tight">{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Map, label: 'Explore' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];
  if (isAdmin) navItems.splice(3, 0, { id: 'admin', icon: ShieldCheck, label: 'Admin' });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-4 z-50">
      <div className="flex justify-around items-center">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
              currentView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${currentView === item.id ? 'scale-110 stroke-[2.5px]' : ''}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen, notifications, user }) => {
  return (
    <header className="px-4 py-4 md:px-8 glass-panel sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
      
      {/* Mobile Brand */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-lg flex items-center justify-center">
          <MapPin className="text-white w-5 h-5" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="ស្វែងរកទីតាំង... (Search locations)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-2xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4 relative">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          
          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel soft-shadow rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-medium">ការជូនដំណឹង (Notifications)</div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : ''}`}>
                    <p className="text-sm">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 overflow-hidden">
          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </header>
  );
};

// --- View: Home ---
const HomeView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation }) => {
  // Filter logic
  const filtered = locations.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="relative rounded-[2rem] overflow-hidden h-[300px] md:h-[400px] soft-shadow group">
        <img 
          src="https://images.unsplash.com/photo-1548678967-f1aca5faee92?auto=format&fit=crop&w=1200&q=80" 
          alt="Cambodia Hero" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium mb-4 w-max border border-white/30">
            គោលដៅពេញនិយម (Popular Destination)
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">ស្វែងរកសម្រស់ធម្មជាតិ <br className="hidden md:block"/>នៃប្រទេសកម្ពុជា</h1>
          <p className="text-slate-200 max-w-xl text-sm md:text-base">Discover the breathtaking landscapes, ancient temples, and vibrant culture of the Kingdom of Wonder.</p>
        </div>
      </div>

      {/* Locations Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            ទីតាំងដែលបានណែនាំ (Recommended)
          </h2>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">មើលទាំងអស់ (View All)</button>
        </div>

        {filtered.length === 0 ? (
           <div className="text-center py-12 text-slate-500">មិនមានទិន្នន័យទេ (No locations found).</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((loc, i) => (
              <LocationCard 
                key={loc.id} 
                location={loc} 
                isFavorite={!!favorites[loc.id]} 
                onToggleFavorite={() => toggleFavorite(loc.id)}
                onClick={() => onOpenLocation(loc)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- View: Explore ---
const ExploreView = ({ locations, searchQuery, favorites, toggleFavorite, onOpenLocation }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Temple', 'Island', 'Mountain', 'City'];

  const filtered = locations.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || l.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold">រុករកទីតាំង (Explore)</h1>
         <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto hide-scrollbar max-w-[60vw] md:max-w-none">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((loc, i) => (
           <div 
             key={loc.id} 
             onClick={() => onOpenLocation(loc)}
             className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl soft-shadow cursor-pointer hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-700/50 group"
           >
             <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden relative shrink-0">
                <img src={loc.image} alt={loc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(loc.id); }}
                  className="absolute top-2 right-2 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${favorites[loc.id] ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
             </div>
             <div className="flex flex-col justify-center flex-1">
                <div className="text-xs text-indigo-500 mb-1 font-medium">{loc.category}</div>
                <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{loc.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{loc.desc}</p>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};


// --- View: Chat ---
const ChatView = ({ chats, user }) => {
  const [msgText, setMsgText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || !user) return;
    
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    await addDoc(chatRef, {
      text: msgText,
      userId: user.uid,
      userName: user.displayName || `User_${user.uid.substring(0,4)}`,
      timestamp: Date.now()
    });
    setMsgText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] glass-panel rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in scale-95 duration-300">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
             <Users className="w-5 h-5" />
           </div>
           <div>
             <h2 className="font-bold">សហគមន៍អ្នកដំណើរ (Travelers Community)</h2>
             <div className="flex items-center gap-1.5 text-xs text-slate-500">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               កំពុងដំណើរការ (Online)
             </div>
           </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
             <p>មិនទាន់មានសារទេ។ (No messages yet.)</p>
          </div>
        ) : (
          chats.map(msg => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex max-w-[80%] md:max-w-[60%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] text-slate-500 ml-2">{msg.userName}</span>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm soft-shadow border border-slate-100 dark:border-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input 
            type="text" 
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="សរសេរសារទីនេះ... (Type a message...)" 
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            type="submit" 
            disabled={!msgText.trim()}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- View: Profile ---
const ProfileView = ({ user, favorites, locations, onOpenLocation }) => {
  const myFavorites = locations.filter(l => favorites[l.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Profile Header Card */}
      <div className="glass-panel p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden soft-shadow border border-white/50 dark:border-slate-700/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 p-1">
          <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 overflow-hidden">
             <User className="w-12 h-12 text-slate-300" />
          </div>
        </div>
        
        <div className="relative z-10 text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold mb-2">គណនីរបស់អ្នក (Your Profile)</h1>
          <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ID: {user?.uid.substring(0, 8)}...
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{myFavorites.length}</div>
              <div className="text-xs text-slate-500">ទីតាំងដែលចូលចិត្ត</div>
            </div>
            <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">អ្នកដំណើរ</div>
              <div className="text-xs text-slate-500">កម្រិត (Level)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites List */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" /> 
          ទីតាំងដែលអ្នកចូលចិត្ត (Favorites)
        </h2>
        
        {myFavorites.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
             <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-500">អ្នកមិនទាន់មានទីតាំងដែលចូលចិត្តទេ។</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myFavorites.map(loc => (
              <div key={loc.id} onClick={() => onOpenLocation(loc)} className="cursor-pointer group relative rounded-2xl overflow-hidden aspect-video soft-shadow">
                <img src={loc.image} alt={loc.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                  <h3 className="text-white font-medium text-lg">{loc.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- View: Admin Dashboard ---
const AdminDashboard = ({ locations, pendingLocations }) => {
  const handleApprove = async (id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'locations', id);
    await updateDoc(docRef, { status: 'approved' });
  };

  const handleReject = async (id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'locations', id);
    await deleteDoc(docRef);
  };

  // Prepare simple chart data
  const categoryCounts = locations.reduce((acc, loc) => {
    acc[loc.category] = (acc[loc.category] || 0) + 1;
    return acc;
  }, {});
  
  const chartData = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ផ្ទាំងគ្រប់គ្រង (Admin Dashboard)</h1>
          <p className="text-slate-500 text-sm mt-1">គ្រប់គ្រងទិន្នន័យ និងពិនិត្យទីតាំងថ្មីៗ</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 mb-1">ទីតាំងសរុប (Total)</p>
              <h3 className="text-3xl font-bold">{locations.length}</h3>
            </div>
            <MapPin className="w-8 h-8 text-indigo-500 opacity-80" />
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 mb-1">រង់ចាំការអនុម័ត (Pending)</p>
              <h3 className="text-3xl font-bold">{pendingLocations.length}</h3>
            </div>
            <Activity className="w-8 h-8 text-amber-500 opacity-80" />
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-teal-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 mb-1">ប្រភេទ (Categories)</p>
              <h3 className="text-3xl font-bold">{Object.keys(categoryCounts).length}</h3>
            </div>
            <Filter className="w-8 h-8 text-teal-500 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts & Approvals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Simple SVG Chart Component */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-indigo-500" />
             ស្ថិតិតាមប្រភេទ (Stats)
           </h3>
           <div className="h-48 flex items-end justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-700 relative">
              {chartData.map((d, i) => {
                const heightPct = (d.count / maxCount) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="w-full max-w-[40px] bg-indigo-500/20 dark:bg-indigo-500/40 rounded-t-md relative flex justify-center group-hover:bg-indigo-500 transition-colors"
                         style={{ height: `${heightPct}%`, minHeight: '4px' }}>
                         <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                    </div>
                  </div>
                )
              })}
           </div>
           <div className="flex justify-between mt-2 px-1">
              {chartData.map((d, i) => (
                <div key={i} className="text-[10px] text-slate-500 text-center w-full truncate" title={d.name}>{d.name}</div>
              ))}
           </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            ការស្នើសុំថ្មីៗ (Pending Approvals)
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {pendingLocations.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                 គ្មានការស្នើសុំទេ (No pending requests).
               </div>
            ) : (
              <div className="space-y-4">
                {pendingLocations.map(loc => (
                  <div key={loc.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-transform hover:-translate-y-1">
                     <img src={loc.image} alt="preview" className="w-full sm:w-24 h-24 sm:h-16 rounded-xl object-cover" />
                     <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-bold text-sm">{loc.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{loc.desc}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">{loc.category}</span>
                     </div>
                     <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleApprove(loc.id)} className="flex-1 sm:flex-none p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-xl transition-colors flex items-center justify-center tooltip" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleReject(loc.id)} className="flex-1 sm:flex-none p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors flex items-center justify-center tooltip" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


// --- Reusable Components ---
const LocationCard = ({ location, isFavorite, onToggleFavorite, onClick, index }) => {
  return (
    <div 
      onClick={onClick}
      className="glass-panel group rounded-[2rem] overflow-hidden cursor-pointer soft-shadow hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/40 dark:border-slate-700/50 flex flex-col h-full bg-white/40 dark:bg-slate-800/40"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={location.image} 
          alt={location.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1548678967-f1aca5faee92?w=500'; }}
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-medium border border-white/20">
            {location.category}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-colors border border-white/30"
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {location.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
          {location.desc}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50 mt-auto">
           <div className="flex items-center gap-1.5 text-xs text-slate-500">
             <Heart className="w-3.5 h-3.5 fill-slate-300 dark:fill-slate-600" /> {location.likes || 0}
           </div>
           <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
             មើលលម្អិត &rarr;
           </span>
        </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose, favorites, toggleFavorite }) => {
  const isFav = !!favorites[location.id];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden soft-shadow border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        
        {/* Modal Image Header */}
        <div className="relative h-64 sm:h-80 shrink-0">
          <img src={location.image} alt={location.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-medium border border-white/20 mb-3 inline-block">
              {location.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{location.title}</h2>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium">
                  <Heart className="w-4 h-4" /> {location.likes || 0} Likes
               </div>
               {location.status === 'pending' && (
                 <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-medium">
                   Pending Approval
                 </span>
               )}
             </div>
             
             <button 
                onClick={() => toggleFavorite(location.id)}
                className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                  isFav 
                    ? 'border-red-200 bg-red-50 text-red-500 dark:bg-red-500/10 dark:border-red-500/30' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              </button>
          </div>

          <div className="prose dark:prose-invert max-w-none">
             <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-indigo-500" />
               ការពិពណ៌នា (Description)
             </h3>
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
               {location.desc}
             </p>
             
             {/* Dummy expanded content for mockup visual balance */}
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
               ទីតាំងនេះត្រូវបានចាត់ទុកថាជាកន្លែងដែលមិនគួររំលងសម្រាប់អ្នកទេសចរជាតិ និងអន្តរជាតិ។ វាផ្តល់នូវបទពិសោធន៍ដែលមិនអាចបំភ្លេចបាន។
               (This location is considered a must-visit for national and international tourists. It offers an unforgettable experience.)
             </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};