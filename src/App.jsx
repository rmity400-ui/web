import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Globe } from 'lucide-react';

// ----------------------------------------------------------------------
// ១. ទិន្នន័យសម្រាប់ប្តូរភាសា (Translations Dictionary)
// ----------------------------------------------------------------------
const translations = {
  km: {
    logo: "Mr mit",
    navHome: "ទំព័រដើម",
    navLessons: "មេរៀន",
    navTcp: "សារ TCP",
    signIn: "ចូលគណនី",
    getStarted: "ចាប់ផ្តើម",
    welcomeTitle: "សូមស្វាគមន៍មកកាន់ Mr mit",
    subtitle: "វិធីដ៏ល្អបំផុតក្នុងការសិក្សា និងស្វែងយល់ពីបច្ចេកវិទ្យា Cyber ព្រមទាំងពិភពឌីជីថល។ ស្វែងរកមេរៀន និងចំណេះដឹងល្អៗនៅទីនេះ។",
    moreInfo: "ព័ត៌មានខាងក្រោម",
    supportedBy: "គាំទ្រដោយ",
  },
  en: {
    logo: "Mr mit",
    navHome: "Home",
    navLessons: "Lessons",
    navTcp: "TCP Messages",
    signIn: "Sign In",
    getStarted: "Get Started",
    welcomeTitle: "Welcome to Mr mit",
    subtitle: "The best way to study and explore Cyber technology and the digital world. Discover great lessons and resources here.",
    moreInfo: "More Info",
    supportedBy: "Supported by",
  }
};

// ----------------------------------------------------------------------
// ២. សមាសភាគផ្ទៃខាងក្រោយ Cyber (Particle Network)
// ----------------------------------------------------------------------
const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }
    }

    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - distance / 800})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#000000' }}
    />
  );
};

// ----------------------------------------------------------------------
// ៣. សមាសភាគគូប 3D Cyber
// ----------------------------------------------------------------------
const GlowingCube = () => {
  const size = 32; 
  const gap = 4;
  const step = size + gap;

  const CubeFace = ({ transform, isGlowing }) => (
    <div
      className={`absolute inset-0 cube-face ${
        isGlowing
          ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
          : 'bg-zinc-900 border border-zinc-700/50'
      }`}
      style={{ transform }}
    />
  );

  const blocks = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if ((x === 1 && y === 1 && z === 1) || (x === -1 && y === -1 && z === 1) || (x === 1 && y === -1 && z === -1)) continue;

        const isGlowing = (x === -1 && y === -1) || (x === 0 && y === 0 && z === 1) || (x === 1 && y === 1);

        blocks.push(
          <div
            key={`${x}-${y}-${z}`}
            className="absolute w-[32px] h-[32px] preserve-3d"
            style={{ transform: `translate3d(${x * step}px, ${y * step}px, ${z * step}px)` }}
          >
            <CubeFace transform="translateZ(16px)" isGlowing={isGlowing} />
            <CubeFace transform="translateZ(-16px) rotateY(180deg)" isGlowing={false} />
            <CubeFace transform="translateX(16px) rotateY(90deg)" isGlowing={false} />
            <CubeFace transform="translateX(-16px) rotateY(-90deg)" isGlowing={isGlowing} />
            <CubeFace transform="translateY(16px) rotateX(-90deg)" isGlowing={false} />
            <CubeFace transform="translateY(-16px) rotateX(90deg)" isGlowing={isGlowing} />
          </div>
        );
      }
    }
  }

  return (
    <div className="relative w-80 h-80 flex items-center justify-center scale-75 md:scale-100" style={{ perspective: '1200px' }}>
      <div className="w-full h-full absolute preserve-3d animate-float-cube flex items-center justify-center origin-center">
        {blocks}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// ៤. សមាសភាគមេ (App)
// ----------------------------------------------------------------------
export default function App() {
  const [lang, setLang] = useState('km'); // 'km' សម្រាប់ភាសាខ្មែរ, 'en' សម្រាប់ភាសាអង់គ្លេស

  const t = translations[lang];

  const toggleLanguage = () => {
    setLang(prev => (prev === 'km' ? 'en' : 'km'));
  };

  return (
    <div className="min-h-screen text-white relative font-sans overflow-hidden">
      {/* បន្ថែម CSS សម្រាប់ 3D និងចលនា */}
      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .cube-face { backface-visibility: hidden; }
        @keyframes float-cube {
          0%, 100% { transform: rotateX(-25deg) rotateY(45deg) translateY(0px); }
          50% { transform: rotateX(-25deg) rotateY(45deg) translateY(-20px); }
        }
        .animate-float-cube { animation: float-cube 6s ease-in-out infinite; }
      `}</style>

      {/* ផ្ទៃខាងក្រោយ Cyber */}
      <ParticleBackground />

      {/* មាតិកាខាងលើ */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-6">
        
        {/* របាររុករក (Navbar) */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-12">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
              {t.logo}
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">{t.navHome}</a>
              <a href="#" className="hover:text-white transition-colors">{t.navLessons}</a>
              <a href="#" className="hover:text-white transition-colors">{t.navTcp}</a>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {/* ប៊ូតុងប្តូរភាសា */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-xs font-medium text-gray-300"
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>{lang === 'km' ? 'English' : 'ខ្មែរ'}</span>
            </button>

            <a href="#" className="text-gray-400 hover:text-white transition-colors hidden md:block px-2">{t.signIn}</a>
            <button className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors">
              {t.getStarted}
            </button>
          </div>
        </nav>

        {/* ផ្នែកកណ្តាល (Hero Section) */}
        <main className="flex-1 flex flex-col md:flex-row items-center justify-between py-12 md:py-0">
          
          {/* អត្ថបទខាងឆ្វេង */}
          <div className="max-w-2xl w-full md:w-1/2 flex flex-col items-start mt-6 md:mt-0">
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.2] mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {t.welcomeTitle}
            </h1>
            
            <p className="text-base md:text-lg text-gray-400 mb-10 max-w-md leading-relaxed">
              {t.subtitle}
            </p>

            <div className="flex items-center gap-6">
              <button className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
                {t.getStarted} <ChevronRight className="w-4 h-4" />
              </button>
              <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                {t.moreInfo} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* រូបភាព 3D ខាងស្តាំ */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-16 md:mt-0">
            <GlowingCube />
          </div>

        </main>

        {/* បាតកថា (Footer) */}
        <footer className="py-8 flex justify-center items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>{t.supportedBy}</span>
            <span className="text-white font-semibold">Mr mit cyber</span>
          </div>
        </footer>

      </div>
    </div>
  );
}