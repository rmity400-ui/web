import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, Map as MapIcon, MessageCircle, ShieldCheck, User, Bell, 
  Search, Heart, Moon, Sun, Plus, MoreVertical, 
  CheckCircle, XCircle, Trash2, Edit3, Image as ImageIcon, Send, Filter,
  LogOut, Settings, Activity, Users, MapPin, TrendingUp, BarChart3, UploadCloud, Link as LinkIcon, AlertTriangle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

// --- Configuration & Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBq_1YKH4Hf4M65qMHirvWCD_-tyqCDz5E",
  authDomain: "ramit-7e364.firebaseapp.com",
  projectId: "ramit-7e364",
  storageBucket: "ramit-7e364.firebasestorage.app",
  messagingSenderId: "1036691345731",
  appId: "11036691345731webdf8121852c6137e3b35ff6"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ramit-7e364';

const ADMIN_PASSWORD = 'ict168m';

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
      
      /* Block mobile screen stretching & double click zooming */
      html, body {
        overscroll-behavior-y: contain;
        touch-action: manipulation;
        max-width: 100vw;
        overflow-x: hidden;
      }

      /* Strict Anti-Zoom Input Focus Setup */
      input, textarea, select {
        font-size: 16px !important;
      }
      
      .glass-panel {
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      .dark .glass-panel {
        background: rgba(30, 41, 59, 0.75);
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

      @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
    `;
    document.head.appendChild(style);
  }
};

// --- Helper: Compress Image to Base64 ---
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 500;
        let width = img.width; let height = img.height;
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
    };
  });
};

// --- Main Application Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // App Pages State: 'page1' (Welcome Gate) or 'page2' (Main Dashboard)
  const [appState, setAppState] = useState('page1');
  
  // Global View States
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data States
  const [adminLocations, setAdminLocations] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [chats, setChats] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [securityLogs, setSecurityLogs] = useState([]);
  
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'សូមស្វាគមន៍មកកាន់កម្មវិធី Khmer TP ជំនាន់ថ្មី!', read: false },
    { id: 2, text: 'អ្នកអាចរុករកទិន្នន័យស្រុក ឃុំ ភូមិ និងទំនាក់ទំនងបានយ៉ាងរហ័ស។', read: true }
  ]);

  // Overlays
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showNameGateModal, setShowNameGateModal] = useState(false);

  // Audio Playback notification signal trigger
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.log('Audio error handled safely');
    }
  };

  // Initialize Auth & Theme
  useEffect(() => {
    injectStyles();
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
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data from separate Collections
  useEffect(() => {
    if (!user) return;

    // 1. Fetching Collection 'admin_data' (Locations added by Admin)
    const adminLocsRef = collection(db, 'artifacts', appId, 'public', 'data', 'admin_data');
    const unsubAdminLocs = onSnapshot(adminLocsRef, (snapshot) => {
      const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminLocations(locs);
    }, (err) => console.error(err));

    // 2. Fetching Collection 'data_user' (Locations added by Users)
    const userLocsRef = collection(db, 'artifacts', appId, 'public', 'data', 'data_user');
    const unsubUserLocs = onSnapshot(userLocsRef, (snapshot) => {
      const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserLocations(locs);
    }, (err) => console.error(err));

    // 3. Fetching Chats (Public community discussion)
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const unsubChats = onSnapshot(chatsRef, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setChats(msgs);
    }, (err) => console.error(err));

    // 4. Fetching Profiles (user_name_data)
    const profsRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_name_data');
    const unsubProfs = onSnapshot(profsRef, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(doc => { map[doc.id] = doc.data(); });
      setUserProfiles(map);
    }, (err) => console.error(err));

    // 5. Fetching Security audit logs
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'security_logs');
    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSecurityLogs(logs.sort((a,b) => b.timestamp - a.timestamp));
    }, (err) => console.error(err));

    return () => {
      unsubAdminLocs();
      unsubUserLocs();
      unsubChats();
      unsubProfs();
      unsubLogs();
    };
  }, [user]);

  // Global Actions
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  // Combine Admin data & Approved User data for Home/Explore feeds
  const allApprovedLocations = useMemo(() => {
    const approvedUserLocs = userLocations.filter(l => l.status === 'approved');
    // Admin locations are automatically approved
    const approvedAdminLocs = adminLocations.map(l => ({ ...l, status: 'approved' }));
    return [...approvedAdminLocs, ...approvedUserLocs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [adminLocations, userLocations]);

  const pendingUserLocations = useMemo(() => {
    return userLocations.filter(l => l.status === 'pending');
  }, [userLocations]);

  const activeUserProfile = useMemo(() => {
    return userProfiles[user?.uid] || { name: '', avatar: '' };
  }, [userProfiles, user]);

  // Navigate check helper (Enforces Name Creation Gate for Data and Chat)
  const handleViewChange = (viewId) => {
    if ((viewId === 'explore' || viewId === 'chat') && !activeUserProfile.name) {
      setShowNameGateModal(true);
    } else {
      setCurrentView(viewId);
    }
  };

  const handleLike = async (locationId, isFromAdminCollection, currentLikes = []) => {
    if (!user) return;
    const collectionName = isFromAdminCollection ? 'admin_data' : 'data_user';
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, locationId);
    const hasLiked = currentLikes?.includes(user.uid);
    try {
      const updatedLikes = hasLiked 
        ? currentLikes.filter(id => id !== user.uid)
        : [...(currentLikes || []), user.uid];

      await updateDoc(docRef, {
        likedBy: updatedLikes,
        likes: updatedLikes.length
      });
    } catch (e) {
      console.error('Like registration failed:', e);
    }
  };

  const handleAdminLoginAttempt = async (pwd) => {
    const triedUser = activeUserProfile.name || 'Anonymous';
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'security_logs');
    
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setCurrentView('admin');
      await addDoc(logsRef, {
        username: triedUser,
        status: 'SUCCESS',
        ip: 'Hidden Private IP',
        device: navigator.userAgent.substring(0, 40),
        timestamp: Date.now()
      });
      alert('ផ្ទៀងផ្ទាត់ជោគជ័យ! សូមស្វាគមន៍មកកាន់ផ្នែករដ្ឋបាល។');
    } else {
      await addDoc(logsRef, {
        username: triedUser,
        status: 'FAILED',
        ip: 'Hidden Private IP',
        device: navigator.userAgent.substring(0, 40),
        timestamp: Date.now()
      });
      alert('លេខសម្ងាត់មិនត្រឹមត្រូវទេ! សកម្មភាពវាយលុកនេះនឹងត្រូវកត់ត្រាទុក។');
    }
  };

  const clearSecurityLogs = async () => {
    try {
      for (const log of securityLogs) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'security_logs', log.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminApprove = async (id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'data_user', id);
    await updateDoc(docRef, { status: 'approved' });
    playAlertSound();
    alert('OK សំណើររបស់អ្នកជោគជ័យអាចដាក់ឲ្យប្រើបានហើយ!');
  };

  const handleAdminReject = async (id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'data_user', id);
    await deleteDoc(docRef);
    playAlertSound();
    alert('NO សំណើររបស់អ្នកមិនត្រូវបានអនុញ្ញាតឲ្យដាក់ប្រើក្នុង Web App ឡើយ! សូមពិនិត្យឡើងវិញ។');
  };

  const handleLocationDelete = async (id, isFromAdminCollection) => {
    const collectionName = isFromAdminCollection ? 'admin_data' : 'data_user';
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, id);
    if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យនេះជាអចិន្ត្រៃយ៍មែនទេ?')) {
      await deleteDoc(docRef);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 font-khmer">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">កំពុងរៀបចំប្រព័ន្ធ...</p>
      </div>
    );
  }

  // --- VIEW: PAGE 1 (WELCOME GATEWAY) ---
  if (appState === 'page1') {
    return (
      <div className={`min-h-screen flex flex-col justify-between items-center p-6 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-khmer`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="my-auto max-w-md w-full text-center space-y-8 z-10 animate-slide-in">
          <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl border-4 border-indigo-500">
            <MapPin className="text-indigo-600 w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
              Khmer TP
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              ស្វែងយល់ពីកម្ពុជា
            </p>
          </div>

          <div className="glass-panel p-6 rounded-[2.2rem] border border-slate-200/50 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">គោលបំណងគម្រោង</h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed text-justify">
              គម្រោងនេះត្រូវបានបង្កើតឡើងក្នុងគោលបំណងជួយសម្រួលដល់ប្រជាពលរដ្ឋក្នុងការស្វែងរកព័ត៌មាន និងលេខទូរស័ព្ទទំនាក់ទំនងសំខាន់ៗរបស់អាជ្ញាធរមូលដ្ឋាន ភូមិ ឃុំ ស្រុករតនមណ្ឌល និងស្រុកផ្សេងៗ ព្រមទាំងផ្តល់លទ្ធភាពក្នុងការផ្ញើសាររាយការណ៍បន្ទាន់ពេលមានហេតុការណ៍បន្ទាន់ផ្សេងៗ។
            </p>
          </div>
        </div>

        <div className="w-full max-w-md pb-8 z-10 animate-slide-in">
          <button 
            onClick={() => setAppState('page2')}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 text-xs uppercase tracking-wider flex justify-center items-center gap-2"
          >
            អនុញ្ញាតឲ្យខ្លួនឯងចូលប្រើ <TrendingUp className="w-4 h-4"/>
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: PAGE 2 (MAIN APPLICATION HUB) ---
  return (
    <div className={`min-h-screen font-khmer transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex min-h-screen w-full">
        
        {/* Desktop Sidebar Navigation */}
        <Sidebar currentView={currentView} setCurrentView={handleViewChange} isAdmin={isAdmin} />

        {/* Main Interface Workspace */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
          
          <TopBar 
            theme={theme} toggleTheme={toggleTheme} 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen}
            notifications={notifications} setNotifications={setNotifications}
            activeProfile={activeProfile}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8 w-full">
            {currentView === 'home' && (
              <HomeView 
                locations={allApprovedLocations} searchQuery={searchQuery}
                user={user} handleLike={handleLike} onOpenLocation={setSelectedLocation}
              />
            )}
            
            {currentView === 'explore' && (
               <ExploreView 
                 locations={allApprovedLocations} searchQuery={searchQuery}
                 user={user} handleLike={handleLike} onOpenLocation={setSelectedLocation}
                 onAddClick={() => setIsAddModalOpen(true)}
               />
            )}

            {currentView === 'reports' && (
              <ReportsView locations={allApprovedLocations} />
            )}

            {currentView === 'chat' && (
              <ChatView 
                chats={chats} user={user} activeProfile={activeProfile} 
                db={db} appId={appId} playAlertSound={playAlertSound}
              />
            )}

            {currentView === 'profile' && (
              <ProfileView 
                user={user} activeProfile={activeProfile} db={db} appId={appId} 
                isAdmin={isAdmin} handleAdminLogin={handleAdminLoginAttempt}
                onLogout={() => setAppState('page1')}
              />
            )}

            {currentView === 'admin' && isAdmin && (
              <AdminDashboard 
                locations={locations}
                adminLocations={adminLocations}
                userLocations={userLocations}
                pendingLocations={pendingUserLocations} 
                securityLogs={securityLogs}
                clearSecurityLogs={clearSecurityLogs}
                handleApprove={handleAdminApprove}
                handleReject={handleAdminReject}
                handleDelete={handleLocationDelete}
                onLogout={() => { setIsAdmin(false); setCurrentView('home'); }}
                onBackToPage1={() => { setIsAdmin(false); setAppState('page1'); }}
              />
            )}
          </div>
          
          {/* Mobile Bottom Navigation */}
          <BottomNav currentView={currentView} setCurrentView={handleViewChange} isAdmin={isAdmin} />

        </main>

        {/* Modal: Sheet Details View */}
        {selectedLocation && (
          <LocationDetailModal 
            location={selectedLocation} onClose={() => setSelectedLocation(null)} 
            user={user} handleLike={handleLike}
          />
        )}

        {/* Modal: Crowdsourced Upload Form Sheet */}
        {isAddModalOpen && (
          <AddDataModal 
            isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} 
            user={user} isAdmin={isAdmin} activeProfile={activeUserProfile} db={db} appId={appId}
            playAlertSound={playAlertSound}
          />
        )}

        {/* Modal: Name Registration Gate Overlay */}
        {showNameGateModal && (
          <NameGateModal 
            isOpen={showNameGateModal} 
            onClose={() => setShowNameGateModal(false)}
            user={user} db={db} appId={appId}
            onSuccess={() => {
              setShowNameGateModal(false);
              setCurrentView('explore');
            }}
          />
        )}

      </div>
    </div>
  );
}

// ==========================================
// NAVIGATION COMPONENTS
// ==========================================

const Sidebar = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម', sub: 'Home' },
    { id: 'explore', icon: MapIcon, label: 'ទិន្នន័យ', sub: 'Data' },
    { id: 'reports', icon: BarChart3, label: 'របាយការណ៍', sub: 'Reports' },
    { id: 'chat', icon: MessageCircle, label: 'សារ', sub: 'Messages' },
    { id: 'profile', icon: User, label: 'គណនី', sub: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'ផ្នែក Admin', sub: 'Management' });
  }

  return (
    <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-200 dark:border-slate-800 z-10 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <MapPin className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">khmer TP</h1>
          <p className="text-[10px] text-slate-500 font-medium">ស្វែងយល់ពីកម្ពុជា</p>
        </div>
      </div>
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 mb-4 px-3 uppercase tracking-wider">MENU</div>
        {navItems.map(item => (
          <button
            key={item.id} onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
              currentView === item.id 
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === item.id ? 'stroke-[2.5px]' : ''}`} />
            <div className="text-left">
              <span className="font-semibold text-sm block leading-none">{item.label}</span>
              <span className="text-[9px] opacity-60 mt-0.5 block">{item.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const BottomNav = ({ currentView, setCurrentView, isAdmin }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'ទំព័រដើម' },
    { id: 'explore', icon: MapIcon, label: 'ទិន្នន័យ' },
    { id: 'reports', icon: BarChart3, label: 'របាយការណ៍' },
    { id: 'chat', icon: MessageCircle, label: 'សារ' },
    { id: 'profile', icon: User, label: 'គណនី' },
  ];
  if (isAdmin) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-1 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] overflow-x-auto hide-scrollbar">
      <div className="flex justify-between items-center min-w-max px-2 gap-1.5">
        {navItems.map(item => (
          <button
            key={item.id} onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-300 ${
              currentView === item.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 ${currentView === item.id ? 'scale-110 stroke-[2.5px]' : ''}`} />
            <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen, notifications, setNotifications, activeProfile }) => {
  return (
    <header className="px-4 py-3 md:px-8 glass-panel sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 shadow-sm">
      <div className="md:hidden flex items-center shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-xl flex items-center justify-center shadow-sm">
          <MapPin className="text-white w-5 h-5" />
        </div>
      </div>
      
      <div className="flex-1 max-w-xl relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
        <input 
          type="text" placeholder="ស្វែងរកទិន្នន័យ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-2xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-teal-500/30 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all text-xs"
        />
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 glass-panel soft-shadow rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-slide-in">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-bold text-xs flex justify-between items-center text-slate-700 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">
                <span>ការជូនដំណឹង (Notifications)</span>
                <button onClick={() => setNotifications([])} className="text-[10px] text-red-500 hover:underline">លុបទាំងអស់</button>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 flex justify-between items-start gap-2">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">{n.text}</p>
                    <button onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} className="text-slate-400 hover:text-red-500 font-bold text-xs">&times;</button>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">គ្មានសារដំណឹងថ្មីឡើយ</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-teal-500 overflow-hidden shrink-0">
          {activeProfile.avatar ? <img src={activeProfile.avatar} className="w-full h-full object-cover" alt="Profile"/> : <User className="w-full h-full p-1.5 text-slate-500" />}
        </div>
      </div>
    </header>
  );
};

// ==========================================
// VIEW: HOME SCREEN
// ==========================================

const HomeView = ({ locations, searchQuery, user, handleLike, onOpenLocation }) => {
  const filtered = locations.filter(l => 
    l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.institution?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-in w-full">
      <div className="relative rounded-[2rem] overflow-hidden h-[220px] md:h-[350px] soft-shadow group">
        <img src="https://images.unsplash.com/photo-1548678967-f1aca5faee92?auto=format&fit=crop&w=1200&q=80" alt="Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 p-5 md:p-10 flex flex-col justify-end">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
            ស្វែងរកទិន្នន័យសំខាន់ៗសម្រាប់<br className="hidden md:block"/>ទាក់ទងពេលមានអាសន្ន!
          </h1>
          <p className="text-teal-300 max-w-xl text-[10px] md:text-sm font-semibold uppercase tracking-wider">Search important data for emergency contacts!</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-4 md:mb-6">
          <Activity className="w-5 h-5 md:w-6 md:h-6 text-teal-500" /> ទីតាំងសំខានៗដែលបានដាក់បញ្ចូល
        </h2>

        {filtered.length === 0 ? (
           <div className="text-center py-10 text-slate-500 border border-dashed rounded-3xl text-xs">មិនមានទិន្នន័យ។</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((loc) => (
              <LocationCard key={loc.id} location={loc} user={user} handleLike={() => handleLike(loc.id, loc.isFromAdmin, loc.likedBy)} onClick={() => onOpenLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// VIEW: DISRICT & REGIONAL DATA LIST
// ==========================================

const ExploreView = ({ locations, searchQuery, user, handleLike, onOpenLocation, onAddClick }) => {
  const [activeDistrict, setActiveDistrict] = useState('រតនមណ្ឌល');
  const districts = ['រតនមណ្ឌល', 'ស្រុកផ្សេងៗ'];

  const filtered = locations.filter(l => {
    const isDistrictMatch = activeDistrict === 'រតនមណ្ឌល' ? l.district === 'រតនមណ្ឌល' : l.district !== 'រតនមណ្ឌល';
    const isSearchMatch = l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc?.toLowerCase().includes(searchQuery.toLowerCase());
    return isDistrictMatch && isSearchMatch;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><MapIcon className="w-5 h-5 md:w-6 md:h-6 text-teal-500" /> ទិន្នន័យ (Data)</h1>
         <button onClick={onAddClick} className="flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95">
           <Plus className="w-5 h-5" /> បន្ថែមទីតាំង
         </button>
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full sm:w-max">
        {districts.map(dist => (
          <button 
            key={dist} onClick={() => setActiveDistrict(dist)}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeDistrict === dist ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            {dist}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 && <p className="text-slate-500 text-xs py-6">មិនទាន់មានទិន្នន័យក្នុងស្រុកនេះទេ។</p>}
        {filtered.map((loc) => (
           <div key={loc.id} onClick={() => onOpenLocation(loc)} className="flex gap-3 md:gap-4 p-3 md:p-4 bg-white dark:bg-slate-900 rounded-2xl soft-shadow cursor-pointer hover:-translate-y-1 transition-transform border border-slate-100 dark:border-slate-800/60 group">
             <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 dark:bg-slate-800">
                <img src={loc.image} alt={loc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div className="flex flex-col justify-center flex-1 overflow-hidden">
                <div className="text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 w-max px-2 py-0.5 rounded font-bold mb-1.5 uppercase">{loc.type}</div>
                <h3 className="font-bold text-xs sm:text-sm mb-1 line-clamp-1">{loc.title}</h3>
                <p className="text-[10px] md:text-xs text-slate-500 line-clamp-1 mb-1 font-semibold">{loc.institution}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-auto font-medium">
                  <Heart className={`w-3.5 h-3.5 ${loc.likedBy?.includes(user?.uid) ? 'fill-red-500 text-red-500' : ''}`} /> {loc.likedBy?.length || 0} Likes
                </div>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// VIEW: ANALYTICAL REPORTS
// ==========================================

const ReportsView = ({ locations }) => {
  const total = locations.length;
  const categories = locations.reduce((acc, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {});
  const colors = ['chart-col-1', 'chart-col-2', 'chart-col-3', 'chart-col-4', 'chart-col-5', 'chart-col-6', 'chart-col-7'];

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-10 w-full animate-slide-in">
      <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-4"><BarChart3 className="w-6 h-6 text-teal-500" /> ផ្ទាំងរបាយការណ៍</h1>

      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="glass-panel p-4 md:p-5 rounded-3xl border-t-4 border-t-teal-500">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1 font-semibold">ទិន្នន័យសរុប</p>
          <h2 className="text-xl md:text-3xl font-extrabold">{total}</h2>
        </div>
        <div className="glass-panel p-4 md:p-5 rounded-3xl border-t-4 border-t-indigo-500">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1 font-semibold">ស្រុករតនមណ្ឌល</p>
          <h2 className="text-xl md:text-3xl font-extrabold">{locations.filter(l=>l.district === 'រតនមណ្ឌល').length}</h2>
        </div>
        <div className="glass-panel p-4 md:p-5 rounded-3xl border-t-4 border-t-amber-500">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1 font-semibold">ស្រុកផ្សេងៗ</p>
          <h2 className="text-xl md:text-3xl font-extrabold">{locations.filter(l=>l.district !== 'រតនមណ្ឌល').length}</h2>
        </div>
      </div>

      <div className="glass-panel p-5 md:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold mb-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">ប្រភេទទិន្នន័យគិតជា %</h3>
        <div className="space-y-4">
          {Object.entries(categories).map(([name, count], i) => {
            const pct = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <div key={name}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{name}</span><span>{pct}% ({count})</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center mt-10 text-[10px] md:text-xs text-slate-400 font-medium">
        រក្សាសិទ្ធិដោយយុវជន vmc វិ.ស.ស @ {new Date().getFullYear()}
      </div>
    </div>
  );
};

// ==========================================
// VIEW: SECURE COMMUNICATOR
// ==========================================

const ChatView = ({ chats, user, activeProfile, db, appId, playAlertSound }) => {
  const [msgText, setMsgText] = useState('');
  const [target, setTarget] = useState('admin');
  const [attachedImage, setAttachedImage] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgText.trim() && !attachedImage) return;

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
      text: msgText,
      image: attachedImage,
      senderId: user.uid,
      senderName: activeProfile.name,
      senderAvatar: activeProfile.avatar || '',
      target: target,
      timestamp: Date.now()
    });
    setMsgText('');
    setAttachedImage(null);
    playAlertSound();
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedImage(await compressImage(file));
    }
  };

  // Only display chats corresponding to user or globally public targets
  const displayChats = chats.filter(c => 
    (c.senderId === user?.uid && c.target === target) || 
    (c.senderId !== user?.uid && c.target === 'all')
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] glass-panel rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-in w-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm">chat TP</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </div>
          </div>
        </div>

        <select 
          value={target} 
          onChange={e => setTarget(e.target.value)}
          className="bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none border border-slate-200 dark:border-slate-700"
        >
          <option value="admin">ទំនាក់ទំនង៖ Admin</option>
          <option value="village">ទំនាក់ទំនង៖ មេភូមិ</option>
          <option value="commune">ទំនាក់ទំនង៖ មេឃុំ</option>
          <option value="police">ទំនាក់ទំនង៖ ប៉ុស្តិ៍ប៉ូលិស</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20 hide-scrollbar">
        {displayChats.map(m => {
          const isMe = m.senderId === user?.uid;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-in`}>
              <div className={`flex gap-2 max-w-[85%] md:max-w-[60%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden border mt-auto">
                  {m.senderAvatar ? <img src={m.senderAvatar} className="w-full h-full object-cover" alt="" /> : <User className="w-full h-full p-1.5 text-slate-500" />}
                </div>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-slate-500 font-bold mb-0.5 px-1">{m.senderName}</span>
                  <div className={`px-4 py-2.5 text-xs md:text-sm ${isMe ? 'bg-teal-500 text-white rounded-2xl rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm border dark:border-slate-700 soft-shadow'}`}>
                    {m.text && <p className="break-words">{m.text}</p>}
                    {m.image && <img src={m.image} className="rounded-lg mt-1 max-w-full h-32 object-cover border border-white/20" alt="attached" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {attachedImage && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t flex justify-between items-center">
          <img src={attachedImage} className="w-10 h-10 object-cover rounded" alt="preview" />
          <button onClick={() => setAttachedImage(null)} className="text-red-500"><XCircle className="w-5 h-5"/></button>
        </div>
      )}

      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-teal-500 cursor-pointer shrink-0">
            <Plus className="w-5 h-5" />
            <input type="file" accept="image/*" onChange={handleFileAttach} className="hidden" />
          </label>
          <input 
            type="text" value={msgText} onChange={e=>setMsgText(e.target.value)}
            placeholder="សរសេរសារសម្ងាត់របស់អ្នកទីនេះ..." 
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2.5 px-4 text-xs outline-none"
          />
          <button type="submit" disabled={!msgText.trim() && !attachedImage} className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-50">
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// VIEW: USER ACCOUNT & THEME SETTINGS
// ==========================================

const ProfileView = ({ user, activeProfile, db, appId, isAdmin, handleAdminLogin, onLogout }) => {
  const [profileName, setProfileName] = useState(activeProfile.name || '');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_name_data', user.uid), {
      name: profileName,
      avatar: activeProfile.avatar || '',
      updatedAt: Date.now()
    }, { merge: true });
    alert('រក្សាទុកគណនីរួចរាល់!');
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await compressImage(file);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_name_data', user.uid), {
        avatar: base64
      }, { merge: true });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in pb-10 w-full">
      <div className="glass-panel p-6 md:p-8 rounded-[2rem] border flex flex-col items-center text-center">
        <label className="relative w-24 h-24 mb-4 group cursor-pointer block">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-teal-500 bg-slate-200 dark:bg-slate-800">
             {activeProfile.avatar ? <img src={activeProfile.avatar} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-full h-full p-5 text-slate-400" />}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <UploadCloud className="w-6 h-6 text-white"/>
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
        </label>
        <h1 className="text-xl font-bold mb-1">{activeProfile.name || 'គណនីរបស់អ្នក (សូមបង្កើតឈ្មោះ)'}</h1>
        <p className="text-[10px] text-slate-500 mb-6 font-mono">ID: {user?.uid.substring(0,10)}...</p>

        <form onSubmit={handleProfileSave} className="w-full max-w-xs space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">ឈ្មោះគណនី (Name) *</label>
            <input 
              type="text" value={profileName} onChange={e=>setProfileName(e.target.value)} required 
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 outline-none text-xs focus:ring-2 focus:ring-teal-500 text-slate-950 dark:text-white" 
              placeholder="វាយបញ្ចូលឈ្មោះ..." 
            />
          </div>
          <button type="submit" className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-xs shadow transition-all active:scale-95">រក្សាទុកព័ត៌មាន</button>
        </form>
      </div>

      {/* Admin challenges */}
      <div className="glass-panel p-6 rounded-[2rem] border">
        <h3 className="font-bold text-sm text-rose-500 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> កិច្ចរដ្ឋបាល (Admin Access)</h3>
        {isAdmin ? (
          <p className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200">អ្នកកំពុងប្រើប្រាស់សិទ្ធិអ្នកគ្រប់គ្រងជាន់ខ្ពស់។</p>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleAdminLogin(adminPasswordInput); setAdminPasswordInput(''); }} className="flex gap-2">
            {/* Password securely hidden with input type password */}
            <input 
              type="password" value={adminPasswordInput} onChange={e=>setAdminPasswordInput(e.target.value)} 
              placeholder="លេខកូដសម្ងាត់ (Admin Password)" required 
              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 outline-none text-xs border border-transparent focus:border-rose-500/50 text-slate-950 dark:text-white" 
            />
            <button type="submit" className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0">ចូល (Login)</button>
          </form>
        )}
      </div>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 rounded-2xl text-xs font-bold shadow-sm transition-colors active:scale-95">
        <LogOut className="w-4 h-4" /> ចាកចេញត្រឡប់ទៅទំព័រទី១ (Back to Gateway)
      </button>
    </div>
  );
};

// ==========================================
// VIEW: ADMINISTRATIVE DASHBOARD (ADMIN)
// ==========================================

const AdminDashboard = ({ 
  locations, adminLocations, userLocations, pendingLocations, securityLogs, 
  clearSecurityLogs, handleApprove, handleReject, handleDelete, onLogout, onBackToPage1 
}) => {
  return (
    <div className="space-y-6 animate-slide-in max-w-6xl mx-auto pb-10 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2.5"><ShieldCheck className="w-6 h-6 text-teal-400" /> ផ្ទាំងគ្រប់គ្រង Admin</h1>
          <p className="text-[10px] text-slate-400 mt-1">រចនាសម្ព័ន្ធគ្រប់គ្រងសិទ្ធិជាន់ខ្ពស់ (Super Admin Mode)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={onBackToPage1} className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700">ទំព័រទី១</button>
          <button onClick={onLogout} className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"><LogOut className="w-4 h-4"/> ចាកចេញ (Logout)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approvals */}
        <div className="glass-panel p-5 rounded-[2rem] border border-amber-200 dark:border-amber-900/30 flex flex-col max-h-[500px]">
          <h3 className="font-bold text-amber-600 text-sm mb-4 flex items-center gap-2"><Bell className="w-4.5 h-4.5" /> កន្លែងអនុម័តសំណើ • {pendingLocations.length}</h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 hide-scrollbar">
            {pendingLocations.map(loc => (
              <div key={loc.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center">
                <img src={loc.image} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" />
                <div className="flex-1 text-sm min-w-0 text-center sm:text-left">
                  <div className="font-bold text-xs truncate">{loc.title}</div>
                  <div className="text-[10px] text-slate-500">ឃុំ៖ {loc.commune} • Type: {loc.type}</div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button onClick={() => handleApprove(loc.id)} className="flex-1 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg active:scale-95">ព្រម</button>
                  <button onClick={() => handleReject(loc.id)} className="flex-1 px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg active:scale-95">បដិសេធ</button>
                </div>
              </div>
            ))}
            {pendingLocations.length === 0 && <p className="text-center py-10 text-xs text-slate-400">គ្មានសំណើរង់ចាំការយល់ព្រមឡើយ</p>}
          </div>
        </div>

        {/* Database Separated Renders */}
        <div className="glass-panel p-5 rounded-[2rem] border flex flex-col max-h-[500px]">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-500 text-sm"><MapIcon className="w-4.5 h-4.5" /> ទិន្នន័យដែលបានបន្ថែម (Separate Collections)</h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 hide-scrollbar">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Collection: admin_data ({adminLocations.length})</p>
              <div className="space-y-1">
                {adminLocations.map(loc => (
                  <div key={loc.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px]">
                    <span className="font-bold truncate">{loc.title} (Admin Panel)</span>
                    <button onClick={() => handleDelete(loc.id, true)} className="text-rose-500 p-1 hover:bg-rose-100 rounded-lg shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Collection: data_user ({userLocations.length})</p>
              <div className="space-y-1">
                {userLocations.map(loc => (
                  <div key={loc.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px]">
                    <span className="font-bold truncate">{loc.title} ({loc.status})</span>
                    <button onClick={() => handleDelete(loc.id, false)} className="text-rose-500 p-1 hover:bg-rose-100 rounded-lg shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Incident Logs Monitor */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-[2rem] border flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-rose-500 text-sm flex items-center gap-2"><AlertTriangle className="w-4.5 h-4.5" /> Security System Monitor Logs</h3>
            <button onClick={clearSecurityLogs} className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold">Clear All</button>
          </div>
          <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 text-[10px] hide-scrollbar">
            {securityLogs.map(log => (
              <div key={log.id} className="py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded font-bold mr-2 ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">User: {log.username} ({log.device})</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
            {securityLogs.length === 0 && <p className="text-center py-4 text-slate-400">No security incidents detected.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CARD & MODAL SYSTEM COMPONENTS
// ==========================================

const LocationCard = ({ location, user, handleLike, onClick }) => {
  const isLiked = location.likedBy?.includes(user?.uid);
  return (
    <div onClick={onClick} className="glass-panel group rounded-[2rem] overflow-hidden cursor-pointer soft-shadow hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full bg-white dark:bg-slate-900/40 border">
      <div className="relative h-32 md:h-40 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
        <img src={location.image} alt={location.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white uppercase">{location.type}</span>
        <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-all border border-white/20 active:scale-110">
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xs md:text-sm line-clamp-1 mb-1">{location.title}</h3>
          <p className="text-[10px] text-slate-400 font-semibold mb-1 truncate">{location.institution}</p>
          <p className="text-[10px] text-slate-500 font-medium">Tel: {location.phone || 'N/A'}</p>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span className="text-teal-500 hover:underline">លម្អិត &rarr;</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-red-500 text-red-500" /> {location.likes || 0}</span>
        </div>
      </div>
    </div>
  );
};

const LocationDetailModal = ({ location, onClose, user, handleLike }) => {
  const isLiked = location.likedBy?.includes(user?.uid);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-slide-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border max-h-[90vh] flex flex-col">
        <div className="relative h-48 md:h-56 shrink-0">
          <img src={location.image} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white"><XCircle className="w-6 h-6" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-900/35 text-teal-600 rounded text-[9px] font-bold mb-2 inline-block">{location.type} • {location.district}</span>
              <h2 className="text-lg font-bold leading-tight">{location.title}</h2>
              <p className="text-xs font-semibold text-slate-500">{location.institution}</p>
            </div>
            <button onClick={() => handleLike(location.id, location.isFromAdmin, location.likedBy)} className={`p-3 rounded-full border ${isLiked ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border"><span className="text-slate-400 block mb-1 font-bold">Tel</span><span className="font-mono font-bold">{location.phone || '...'}</span></div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border"><span className="text-slate-400 block mb-1 font-bold">Local</span><span className="font-bold truncate block">ឃុំ {location.commune||'...'}, ភូមិ {location.village||'...'}</span></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border">
            <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase">ការពិពណ៌នា</h4>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{location.desc || 'មិនមានការពិពណ៌នាបន្ថែមឡើយ។'}</p>
          </div>
          {location.mapLink && (
            <a href={location.mapLink} target="_blank" className="flex justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"><LinkIcon className="w-4 h-4"/> បើក Google Map</a>
          )}
        </div>
      </div>
    </div>
  );
};

const AddDataModal = ({ isOpen, onClose, user, isAdmin, activeProfile, db, appId, playAlertSound }) => {
  const [formData, setFormData] = useState({ title: '', institution: '', phone: '', mapLink: '', desc: '', district: 'រតនមណ្ឌល', commune: '', village: '', type: 'សាលារៀន' });
  const [b64, setB64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusAlertText, setStatusAlertText] = useState('');

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!formData.title || !b64) {
      alert('សូមបញ្ជូលព័ត៌មាន និងអាប់ឡូតរូបភាពឱ្យបានត្រឹមត្រូវ!');
      return;
    }
    setSubmitting(true);
    setStatusAlertText('រាល់សំណើរ និងទិន្នន័យដែលអ្នកបានផ្ញើរនិងត្រូវត្រួតពិនិត្យដោយ admin មុនដាក់ឲ្យប្រើក្នុង web app ហើយសូមរង់ចាំរយះពេល 2 នាទី');
    
    try {
      const collectionName = isAdmin ? 'admin_data' : 'data_user';
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), {
        ...formData,
        image: b64,
        status: isAdmin ? 'approved' : 'pending',
        likes: 0,
        likedBy: [],
        authorId: user.uid,
        authorName: activeProfile.name || 'Anonymous',
        isFromAdmin: isAdmin,
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        playAlertSound();
        if (isAdmin) {
          alert('OK សំណើររបស់អ្នកជោគជ័យអាចដាក់ឲ្យប្រើបានហើយ!');
        } else {
          alert('OK សំណើររបស់អ្នកជោគជ័យអាចដាក់ឲ្យប្រើបានហើយ! (រង់ចាំការយល់ព្រមពីអ្នកគ្រប់គ្រង)');
        }
        onClose();
        setSubmitting(false);
        setStatusAlertText('');
      }, 2500);

    } catch(err) {
      alert('NO សំណើររបស់អ្នកមិនត្រូវបានអនុញ្ញាតឲ្យដាក់ប្រើក្នុង Web App ឡើយ! សូមព្យាយាមឡើងវិញ។');
      setSubmitting(false);
      setStatusAlertText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 animate-slide-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-sm font-bold text-teal-600 flex items-center gap-2"><Plus className="w-4.5 h-4.5"/> បន្ថែមទីតាំង</h2>
          <button onClick={onClose}><XCircle className="w-5.5 h-5.5 text-slate-400"/></button>
        </div>
        <form onSubmit={submit} className="p-4 overflow-y-auto space-y-4 hide-scrollbar">
          {statusAlertText && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl leading-relaxed animate-slide-in">
              {statusAlertText}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ស្រុកផ្កាយរណប *</label><select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none font-bold"><option value="រតនមណ្ឌល">រតនមណ្ឌល</option><option value="ស្រុកផ្សេងៗ">ស្រុកផ្សេងៗ</option></select></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ប្រភេទទីតាំង *</label><select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none font-bold"><option value="សាលារៀន">សាលារៀន</option><option value="មន្ទីរពេទ្យ">មន្ទីរពេទ្យ</option><option value="ប៉ុស្តិ៍ប៉ូលិស">ប៉ុស្តិ៍ប៉ូលិស</option><option value="មេភូមិ">មេភូមិ</option><option value="មេឃុំ">មេឃុំ</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ឃុំ (Commune)</label><input type="text" value={formData.commune} onChange={e=>setFormData({...formData, commune: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none" placeholder="ឃុំ..."/></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ភូមិ (Village)</label><input type="text" value={formData.village} onChange={e=>setFormData({...formData, village: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none" placeholder="ភូមិ..."/></div>
          </div>
          <div className="text-xs space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ឈ្មោះទីតាំង/បុគ្គល *</label><input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none" placeholder="ឈ្មោះ..."/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ស្ថាប័ន</label><input type="text" value={formData.institution} onChange={e=>setFormData({...formData, institution: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none" placeholder="..."/></div>
              <div><label className="block text-[10px] font-bold text-slate-400 mb-1">លេខទូរស័ព្ទ *</label><input required type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none" placeholder="012..."/></div>
            </div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Google Map URL</label><input type="url" value={formData.mapLink} onChange={e=>setFormData({...formData, mapLink: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none" placeholder="https://..."/></div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 mb-1">រូបភាព (Upload Picture ផ្ទាល់ - ហាមប្រើ URL) *</label>
               <label className="w-full h-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden bg-slate-50 cursor-pointer">
                 {b64 ? <img src={b64} className="w-full h-full object-cover" alt=""/> : <div className="flex flex-col items-center text-slate-400 text-[10px] font-bold"><UploadCloud className="w-5 h-5 text-teal-500 mb-0.5"/> ចុចជ្រើសរើសរូបភាព</div>}
                 <input type="file" accept="image/*" onChange={async(e)=>{if(e.target.files[0]) setB64(await compressImage(e.target.files[0]))}} className="hidden"/>
               </label>
            </div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ការពិពណ៌នា</label><textarea value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} rows="2" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none resize-none"></textarea></div>
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold active:scale-95 flex justify-center mt-2">{submitting ? 'កំពុងផ្ញើ...' : 'ផ្ញើរសំណើរទៅកាន់ Admin'}</button>
        </form>
      </div>
    </div>
  );
};

const NameGateModal = ({ isOpen, onClose, user, db, appId, onSuccess }) => {
  const [tempName, setTempName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const submitName = async (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_name_data', user.uid), {
        name: tempName,
        avatar: '',
        updatedAt: Date.now()
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full border text-center space-y-4 shadow-2xl">
         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto"><User className="w-6 h-6"/></div>
         <div>
            <h3 className="font-bold text-base text-slate-850 dark:text-white">សូមបង្កើតឈ្មោះរបស់អ្នកជាមុនសិន</h3>
            <p className="text-[11px] text-slate-400">តម្រូវការទិន្នន័យដើម្បីទទួលបានការអនុញ្ញាតផ្ញើសំណើ</p>
         </div>
         <form onSubmit={submitName} className="space-y-3">
            <input required type="text" value={tempName} onChange={e=>setTempName(e.target.value)} placeholder="បញ្ចូលឈ្មោះបង្ហាញរបស់អ្នក..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 outline-none text-sm text-slate-950 dark:text-white"/>
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">{submitting?'កំពុងរក្សាទុក...':'កំណត់ឈ្មោះ'}</button>
         </form>
      </div>
    </div>
  );
};