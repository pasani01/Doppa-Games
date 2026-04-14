import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';

import './App.css';

// Lazy load admin for performance
const AdminPanel = lazy(() => import('./AdminPanel'));

// Assets
import logoImg from './assets/dgames2.png';
import customIcon from './assets/Artboeeeeeeeaeeeerd 1.png';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin);

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`main-nav-wrapper ${scrolled ? 'scrolled' : ''}`}>
      <nav className="nav-container">
        <div className="logo-container">
          <img src={logoImg} alt="Doppa Games Logo" id="nav-logo" />
        </div>
        <ul className="nav-links">
          <li><a href="#games" id="nav-link-games">Games</a></li>
          <li><a href="#about" id="nav-link-studio">Studio</a></li>
          <li><a href="#community" id="nav-link-contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
};

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div
        className="custom-cursor"
        aria-hidden="true"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 3 : 1})`,
        }}
      />
      <div
        className="cursor-follower"
        aria-hidden="true"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 0.4 : 1})`,
        }}
      />
    </>
  );
};

const GameCard = ({ game, index }: { game: any; index: number }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
      className="game-card"
      onClick={() => game.url && window.open(game.url, '_blank')}
      id={`game-card-${game.id || index}`}
    >
      <div className="card-glass-effect" />
      <div className="card-content-wrapper">
        {game.img ? (
          <div className="card-img-wrapper">
            <img src={game.img} alt={`Screenshot of ${game.name}`} className="card-img" loading="lazy" />
            <div className="card-platform-tag">{game.platform || 'Steam'}</div>
          </div>
        ) : (
          <div className="card-icon-placeholder">
            <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
            <span>Coming Soon</span>
          </div>
        )}
        <div className="card-body">
          <h3 className="game-name">{game.name}</h3>
          <p className="game-desc">{game.desc}</p>
          <div className="tag-list" aria-label="Game tags">
            {game.tags?.map((tag: string, j: number) => (
              <span key={j} className="tag-item">{tag}</span>
            ))}
          </div>
        </div>
        <div className="card-footer">
          <span className="release-status">{game.status === 'released' ? 'Available Now' : 'In Development'}</span>
          <div className="card-action-btn">
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

const App = () => {
  const [games, setGames] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage })
      });
      if (res.ok) {
        alert("Xabaringiz muvaffaqiyatli yuborildi!");
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      } else {
        alert("Xatolik yuz berdi, iltimos keyinroq qayta urinib ko'ring.");
      }
    } catch (err) {
      alert("Server bilan ulanishda xatolik.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/api/games/`),
          fetch(`${API_BASE}/api/settings/`)
        ]);
        if (gamesRes.ok) setGames(await gamesRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (window.location.pathname === '/admin') {
    return (
      <Suspense fallback={<div className="admin-loader">Loading Admin Panel...</div>}>
        <AdminPanel />
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      <CustomCursor />
      <div className="grid-overlay" aria-hidden="true" />
      <div className="bg-blob blob-1" aria-hidden="true" />
      <div className="bg-blob blob-2" aria-hidden="true" />

      <motion.div 
        className="progress-bar" 
        style={{ scaleX }} 
        id="page-progress" 
      />

      <Header />

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hero-badge"
            >
              <span className="dot" aria-hidden="true" />
              <span>EST. 2024 • THE NEXT CHAPTER OF GAMING</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            >
              CRAFTING THE <br /> <span className="glow-text">FUTURE</span> OF INDIE.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            >
              {settings?.tagline || "DOPPA GAMES — O'zbekistondagi eng innovatsion indie o'yin jamoasi. Biz oylik g'oyalarni global o'yinlarga aylantiramiz."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
              className="hero-actions"
            >
              <button 
                className="btn-discover" 
                onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                id="btn-explore-works"
              >
                Explore Works <i className="fa-solid fa-arrow-down-long" aria-hidden="true"></i>
              </button>
            </motion.div>
          </div>

          <div className="hero-visual">
            <div className="visual-orb" aria-hidden="true" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
              className="hero-image-wrapper"
            >
              <img src={logoImg} alt="Doppa Games Visual" className="hero-main-img" />
              <div className="glass-stats-card">
                <div className="stat-item">
                  <span className="val">{games.length > 0 ? games.length : '5'}</span>
                  <span className="lbl">Projects</span>
                </div>
                <div className="divider" aria-hidden="true" />
                <div className="stat-item">
                  <span className="val">20+</span>
                  <span className="lbl">Creators</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="games" className="games-section">
          <header className="section-title-wrap">
            <span className="eyebrow">Creative Portfolio</span>
            <h2 id="games-title">Selected Productions</h2>
          </header>

          <div className="games-grid">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid-loader"
                >
                  <p>Initializing Universe...</p>
                </motion.div>
              ) : games.length > 0 ? (
                games.map((game, i) => (
                  <GameCard key={game.id || i} game={game} index={i} />
                ))
              ) : (
                <div className="empty-state">
                  <i className="fa-solid fa-rocket-launch"></i>
                  <p>Yangi sarguzashtlar yaqin orada...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section id="about" className="about-section">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="about-container"
          >
            <div className="about-text-content">
              <span className="eyebrow">Biz haqimizda</span>
              <h2>{settings?.about_title || "Chegaralarni kashf eting"}</h2>
              <div className="text-p">
                <p>{settings?.about_p1 || "Doppa Games — asos solinganiga qaramay, xalqaro miqyosdagi professional indie o'yinlar studiyalaridan biri."}</p>
                <p>{settings?.about_p2 || "Bizning jamoa har bir loyihada sifat va innovatsiyani birinchi o'ringa qo'yadi."}</p>
              </div>
              <div className="about-stats-grid">
                <div className="stat-box">
                  <span className="num">2024</span>
                  <span className="txt">Founded</span>
                </div>
                <div className="stat-box">
                  <span className="num">Global</span>
                  <span className="txt">Reach</span>
                </div>
              </div>
            </div>
            
            <div className="about-cards-visual">
              <div className="feature-card">
                <div className="icon-wrap"><i className="fa-solid fa-microchip"></i></div>
                <h3>Next-Gen</h3>
                <p>Eng so'nggi texnologiyalar bilan o'yinlar yaratamiz.</p>
              </div>
              <div className="feature-card highlighted">
                <div className="icon-wrap"><i className="fa-solid fa-heart"></i></div>
                <h3>Community</h3>
                <p>O'yinchilar bizning eng katta ilhom manbaimiz.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="community" className="contact-wrapper">
          <div className="contact-inner">
            <div className="contact-branding">
              <h2>Let's Talk About <br /> <span className="gradient-text">The Next Level</span>.</h2>
              <p>Savollaringiz bormi? Biz bilan bog'laning va kelajakni birga quramiz.</p>
              <div className="contact-channels">
                <a href={`https://t.me/${settings?.telegram || 'doppagames_admin'}`} target="_blank" rel="noreferrer" className="channel">
                  <i className="fa-brands fa-telegram"></i>
                  <span>@doppagames_admin</span>
                </a>
                <a href={`mailto:${settings?.email || 'info@doppagames.uz'}`} className="channel">
                  <i className="fa-solid fa-envelope"></i>
                  <span>{settings?.email || 'info@doppagames.uz'}</span>
                </a>
              </div>
            </div>
            <form className="contact-form-ui" onSubmit={handleContactSubmit}>
              <div className="form-row">
                <input type="text" placeholder="Ismingiz" value={contactName} onChange={e => setContactName(e.target.value)} required id="input-name" />
                <input type="email" placeholder="Emailingiz" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required id="input-email" />
              </div>
              <textarea placeholder="Xabaringizni bu yerda qoldiring..." rows={5} value={contactMessage} onChange={e => setContactMessage(e.target.value)} required id="input-message"></textarea>
              <button type="submit" className="submit-action" disabled={isSending} id="btn-send-message">
                {isSending ? "Processing..." : <>Send Message <i className="fa-solid fa-paper-plane"></i></>}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand-area">
            <img src={logoImg} alt="Doppa Games" className="footer-logo" id="footer-logo-img" />
            <p className="footer-mission">Building immersive experiences for a global audience. Every pixel matters.</p>
          </div>
          <div className="footer-navigation">
            <div className="nav-col">
              <h4>Navigate</h4>
              <a href="#home">Home</a>
              <a href="#games">Games</a>
              <a href="#about">Studio</a>
            </div>
            <div className="nav-col">
              <h4>Social</h4>
              <a href="https://t.me/doppagames" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="https://discord.gg/rydhHrzF" target="_blank" rel="noopener noreferrer">Discord</a>
              <a href="https://instagram.com/doppa.games" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-legal">
          <p>© 2024 - 2026 DOPPA GAMES. All Rights Reserved.</p>
          <div className="legal-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
