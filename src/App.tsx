import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';

import './App.css';

// Assets
import logoImg from './assets/dgames2.png';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="logo-container">
        <img src={logoImg} alt="Doppa Games" />
      </div>
      <div className="nav-links">
        <a href="#games">Games</a>
        <a href="#about">Studio</a>
        <a href="#community">Contact</a>
      </div>
    </nav>
  );
};

const AdminPanel = () => {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  if (!auth) {
    return (
      <>
        <CustomCursor />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', background: 'var(--bg)', color: 'white' }}>
          <h2 style={{ marginBottom: 20 }}>Admin Panel Login</h2>
          <input 
            placeholder="Login" 
            value={user} 
            onChange={e => setUser(e.target.value)}
            style={{ marginBottom: 10, padding: 10, borderRadius: 8, width: 200, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)' }} 
          />
          <input 
            type="password"
            placeholder="Password" 
            value={pass} 
            onChange={e => setPass(e.target.value)}
            style={{ marginBottom: 20, padding: 10, borderRadius: 8, width: 200, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)' }} 
          />
          <button 
            onClick={async () => {
              try {
                const res = await fetch('http://localhost:8001/api/admin/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username: user, password: pass })
                });
                if (res.ok) setAuth(true);
                else alert('Noto\'g\'ri login yoki parol');
              } catch (e) {
                alert('Tizimga ulanishda xatolik yuz berdi. Server aloqasi yo\'q.');
              }
            }}
            className="btn-submit"
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            Tizimga kirish
          </button>
        </div>
      </>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'white' }}>
      <iframe src="http://localhost:8001/admin" style={{ width: '100%', height: '100%', border: 'none' }} />
    </div>
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
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 3 : 1})`
        }}
      />
      <div
        className="cursor-follower"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 0.4 : 1})`
        }}
      />
    </>
  );
};

const GameCard = ({ game, index }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="game-card"
      onClick={() => window.open(game.url, '_blank')}
      style={{ cursor: 'pointer' }}
    >
      {game.img ? (
        <div className="card-img-wrapper">
          <img src={game.img} alt={game.name} className="card-img" />
          <div className="card-platform">{game.platform || 'Steam'}</div>
        </div>
      ) : (
        <div className="card-icon">
          <i className="fa-solid fa-gamepad" style={{ fontSize: '32px' }}></i>
        </div>
      )}
      <div className="game-name">{game.name}</div>
      <div className="game-desc">{game.desc}</div>
      <div className="tag-list">
        {game.tags.map((tag: string, j: number) => (
          <span key={j} className="tag-item">{tag}</span>
        ))}
      </div>
      <div className="card-arrow">
        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '24px' }}></i>
      </div>
    </motion.div>
  );
};

const App = () => {
  const [games, setGames] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, settingsRes] = await Promise.all([
          fetch('http://localhost:8001/api/games'),
          fetch('http://localhost:8001/api/settings')
        ]);
        setGames(await gamesRes.json());
        setSettings(await settingsRes.json());
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (window.location.pathname === '/admin') {
    return <AdminPanel />;
  }

  return (
    <div className="app-container">
      <CustomCursor />
      <div className="grid-overlay" />
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />

      <motion.div className="progress-bar" style={{ scaleX, position: 'fixed', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)', zIndex: 1001, transformOrigin: '0%', boxShadow: '0 0 10px var(--primary)' }} />

      <Header />

      <section className="hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hero-tag"
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)', boxShadow: '0 0 10px var(--primary-light)' }} />
            <span>EST. 2024 • THE FUTURE OF INDIE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            PLAY THE <br /> UNEXPECTED.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            DOPPA GAMES — O'zbekistondagi eng innovatsion indie o'yin jamoasi. Biz oylik g'oyalarni global o'yinlarga aylantiramiz.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ marginTop: '40px' }}
          >
            <button 
              className="btn-primary" 
              onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'white',
                color: 'black',
                padding: '20px 40px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: 'all 0.3s'
              }}
            >
              Explore Projects <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '24px' }}></i>
            </button>
          </motion.div>
        </div>

        <div className="hero-visual">
          <div className="main-orb" />
          <div className="secondary-orb" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="hero-image-container"
          >
            <img src={logoImg} alt="Doppa Games" className="hero-logo-large" />
            <div className="glass-card-overlay">
              <div className="stat">
                <span className="stat-value">12+</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat">
                <span className="stat-value">5M+</span>
                <span className="stat-label">Players</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="games" className="games-section">
        <div className="section-header">
          <span style={{ color: 'var(--primary-light)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px' }}>Our Universe</span>
          <h2>Selected Works</h2>
        </div>

        <div className="games-grid">
          <AnimatePresence>
            {loading ? (
              <div key="loader">Digitalizing catalog...</div>
            ) : (
              games.map((game, i) => (
                <GameCard key={i} game={game} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      <section id="about" className="about-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="about-content"
        >
          <div className="about-text">
            <span className="section-eyebrow">Biz haqimizda</span>
            <h2>{settings?.about_title || "Eng ilg'or indie studiyasi"}</h2>
            <p>{settings?.about_p1 || "Doppa Games — asos solinganiga qaramay, xalqaro miqyosdagi professional indie o'yinlar studiyalaridan biri."}</p>
            <p>{settings?.about_p2 || "Hozirda yangi loyihalar ustida qizg'in ish olib borilmoqda."}</p>
            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-num">2026</span>
                <span className="about-stat-lbl">Asos solingan</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-num">1+</span>
                <span className="about-stat-lbl">Steam o'yinlari</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-num">Global</span>
                <span className="about-stat-lbl">Worldwide</span>
              </div>
            </div>
          </div>
          <div className="about-visual">
            <div className="about-card">
              <div className="about-card-icon"><i className="fa-solid fa-bolt" style={{ fontSize: '40px', color: 'var(--primary-light)' }}></i></div>
              <h3>Innovatsiya</h3>
              <p>Har bir o'yinda yangi mexanika va g'oyalarni sinab ko'ramiz</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon"><i className="fa-solid fa-bullseye" style={{ fontSize: '40px', color: 'var(--primary-light)' }}></i></div>
              <h3>Sifat</h3>
              <p>Ozroq, lekin sifatli — bu bizning falsafamiz</p>
            </div>
            <div className="about-card" style={{ gridColumn: '1 / -1' }}>
              <div className="about-card-icon"><i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '40px', color: 'var(--primary-light)' }}></i></div>
              <h3>O'yinchilar uchun</h3>
              <p>Har bir qaror o'yinchilar tajribasini yaxshilash maqsadida qabul qilinadi</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="community" className="contact-section">
        <div className="contact-card">
          <div className="contact-info">
            <h2>Let's Build the Future Together.</h2>
            <p>Yangi loyihalar, hamkorlik yoki shunchaki salom berish uchun bizga yozing.</p>
            <div className="contact-methods">
              <div className="method">
                <i className="fa-brands fa-telegram" style={{ color: 'var(--primary)', fontSize: '24px' }}></i>
                <span>@doppagames_admin</span>
              </div>
              <div className="method">
                <i className="fa-solid fa-envelope" style={{ color: 'var(--primary)', fontSize: '24px' }}></i>
                <span>info@doppagames.uz</span>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Ismingiz" required />
            <input type="email" placeholder="Emailingiz" required />
            <textarea placeholder="Xabaringiz" rows={4} required></textarea>
            <button type="submit" className="btn-submit">Send Message <i className="fa-solid fa-chevron-right" style={{ fontSize: '20px' }}></i></button>
          </form>
        </div>
      </section>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo-container">
              <img src={logoImg} alt="Doppa Games" />
            </div>
            <p>Innovatsiya, sifat va o'yinchilar tajribasi bizning asosiy qadriyatlarimizdir. Kelajak o'yinlarini birgalikda barpo etamiz.</p>
          </div>
          <div className="footer-links">
            <h4>Navigate</h4>
            <ul>
              <li><a href="#games">Games</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#careers">Careers</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Connect</h4>
            <ul>
              <li><a href="#" className="footer-link-item"><i className="fa-brands fa-telegram" style={{ fontSize: '18px' }}></i> Telegram</a></li>
              <li><a href="#" className="footer-link-item"><i className="fa-brands fa-discord" style={{ fontSize: '18px' }}></i> Discord</a></li>
              <li><a href="#" className="footer-link-item"><i className="fa-brands fa-instagram" style={{ fontSize: '18px' }}></i> Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 DOPPA GAMES — PUSHING THE BOUNDARIES OF GAMING.</p>
          <div style={{ display: 'flex', gap: '30px', opacity: 0.5 }}>
            <a href="#">PRIVACY POLICY</a>
            <a href="#">TERMS OF SERVICE</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
