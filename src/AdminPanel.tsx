import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin);

// Design Tokens
const COLORS = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  bg: '#0f0f1a',
  card: '#1a1a2e',
  border: '#2d2d44',
  text: '#ffffff',
  textMuted: '#94a3b8',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b'
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, color: 'white', fontSize: 14, boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', transition: 'border-color 0.2s' };
const btnPrimary: React.CSSProperties = { background: COLORS.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, transition: 'all 0.2s shadow' };
const btnDanger: React.CSSProperties = { background: 'rgba(239,68,68,0.1)', color: COLORS.danger, border: 'none', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnEdit: React.CSSProperties = { background: 'rgba(139,92,246,0.1)', color: COLORS.primaryLight, border: 'none', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 };
const cardStyle: React.CSSProperties = { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: 32, marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };

const Field = ({ label, type = 'text', value, onChange, ...rest }: any) => (
  <div style={{ marginBottom: 18 }}>
    <label style={labelStyle}>{label}</label>
    {type === 'textarea'
      ? <textarea value={value} onChange={onChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} {...rest} />
      : type === 'select'
        ? <select value={value} onChange={onChange} style={inputStyle} {...rest} />
        : <input type={type} value={value} onChange={onChange} style={inputStyle} {...rest} />
    }
  </div>
);

const ModalWrap = ({ children, title, onSave, onClose, loading }: any) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 28, padding: 40, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'white' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: COLORS.textMuted, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>×</button>
      </div>
      {children}
      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '14px', borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>Bekor qilish</button>
        <button onClick={onSave} disabled={loading} style={{ ...btnPrimary, flex: 2, justifyContent: 'center', padding: '14px', fontSize: 15, background: COLORS.primaryDark }}>
          {loading ? 'Saqlanmoqda...' : <><i className="fa-solid fa-floppy-disk"></i> Saqlash</>}
        </button>
      </div>
    </div>
  </div>
);

export default function AdminPanel() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('doppa_token') || '');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'profile' | 'settings' | 'messages'>(null);
  const [editGame, setEditGame] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [profileForm, setProfileForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastOk, setToastOk] = useState(true);

  const authH = { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` };

  const showToast = (msg: string, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 4000);
  };

  const checkResponse = async (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      logout();
      showToast("Seans muddati tugadi, qaytadan kiring", false);
      throw new Error("Unauthorized");
    }
    return res;
  };

  const fetchAll = async (tok = token) => {
    try {
      const headers = { 'Authorization': `Token ${tok}` };
      const [gR, sR] = await Promise.all([
        fetch(`${API_BASE}/api/games/`, { headers }).then(checkResponse),
        fetch(`${API_BASE}/api/settings/`, { headers }).then(checkResponse),
      ]);
      if (gR.ok) setGames(await gR.json());
      if (sR.ok) setSettings(await sR.json());
    } catch (e) { console.error(e); }
  };

  const fetchProfile = async (tok = token) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/profile`, { headers: { 'Authorization': `Token ${tok}` } }).then(checkResponse);
      if (r.ok) { 
        const d = await r.json(); 
        setAdminInfo(d); 
        setProfileForm({ ...d, password: '' }); 
      }
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/contact/`, { headers: authH }).then(checkResponse);
      if (r.ok) setMessages(await r.json());
    } catch {}
  };

  useEffect(() => {
    if (token) { fetchAll(); fetchProfile(); }
  }, [token]);

  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      if (res.ok) {
        const d = await res.json();
        setToken(d.token);
        localStorage.setItem('doppa_token', d.token);
        showToast("Xush kelibsiz!");
      } else {
        const e = await res.json();
        setLoginError(e.detail || "Noto'g'ri login yoki parol");
      }
    } catch { setLoginError("Server bilan ulanishda xatolik. Django ishni davom ettiryaptimi?"); }
    setLoading(false);
  };

  const logout = () => { setToken(''); localStorage.removeItem('doppa_token'); setAdminInfo(null); };

  const openAdd = () => {
    setForm({ name: '', desc: '', long_desc: '', tags: '', platform: 'Steam', url: '', img: '', status: 'upcoming', release_date: '', featured: false });
    setEditGame(null);
    setModal('add');
  };

  const openEdit = (g: any) => {
    setEditGame(g);
    setForm({ ...g, tags: Array.isArray(g.tags) ? g.tags.join(', ') : (g.tags || '') });
    setModal('edit');
  };

  const saveGame = async () => {
    setLoading(true);
    const payload = { ...form, tags: (form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean) };
    const url = editGame ? `${API_BASE}/api/games/${editGame.id}/` : `${API_BASE}/api/games/`;
    const method = editGame ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, { method, headers: authH, body: JSON.stringify(payload) }).then(checkResponse);
      if (r.ok) { showToast(editGame ? "✅ O'yin yangilandi!" : "✅ O'yin qo'shildi!"); setModal(null); fetchAll(); }
      else { const e = await r.json(); showToast("❌ Xato: " + JSON.stringify(e), false); }
    } catch { showToast("❌ Server xatosi", false); }
    setLoading(false);
  };

  const deleteGame = async (id: number, name: string) => {
    if (!confirm(`"${name}" o'yinni o'chirmoqchimisiz?`)) return;
    try {
      const r = await fetch(`${API_BASE}/api/games/${id}/`, { method: 'DELETE', headers: authH }).then(checkResponse);
      if (r.ok) { showToast("✅ O'chirildi!"); fetchAll(); }
      else showToast("❌ O'chirishda xato", false);
    } catch { showToast("❌ Server xatosi", false); }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/settings/${settings.id}/`, { method: 'PUT', headers: authH, body: JSON.stringify(settingsForm) }).then(checkResponse);
      if (r.ok) { showToast("✅ Sozlamalar saqlandi!"); setModal(null); fetchAll(); }
      else showToast("❌ Xato", false);
    } catch { showToast("❌ Server xatosi", false); }
    setLoading(false);
  };

  const saveProfile = async () => {
    setLoading(true);
    const payload: any = { ...profileForm };
    if (!payload.password) delete payload.password;
    try {
      const r = await fetch(`${API_BASE}/api/admin/profile`, { method: 'PUT', headers: authH, body: JSON.stringify(payload) }).then(checkResponse);
      const d = await r.json();
      if (r.ok) {
        showToast("✅ Profil yangilandi!");
        if (d.new_token) { setToken(d.new_token); localStorage.setItem('doppa_token', d.new_token); }
        setModal(null);
        fetchProfile(d.new_token || token);
      } else showToast("❌ " + (d.detail || "Xato"), false);
    } catch { showToast("❌ Server xatosi", false); }
    setLoading(false);
  };

  // ── LOGIN PAGE ────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: COLORS.bg, color: 'white' }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 32, padding: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <i className="fa-solid fa-gamepad" style={{ fontSize: 40, color: COLORS.primaryLight }}></i>
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Doppa Admin</h2>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 14, textAlign: 'center' }}>Xavfsiz boshqaruv paneliga kiring</p>
          
          {loginError && <div style={{ background: 'rgba(239,68,68,0.1)', color: COLORS.danger, padding: '12px 16px', borderRadius: 12, fontSize: 13, width: '100%', textAlign: 'center', boxSizing: 'border-box', border: `1px solid rgba(239,68,68,0.2)` }}>{loginError}</div>}
          
          <div style={{ width: '100%' }}>
            <Field label="Username" value={loginUser} onChange={(e: any) => setLoginUser(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()} />
            <Field label="Parol" type="password" value={loginPass} onChange={(e: any) => setLoginPass(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()} />
          </div>
          
          <button onClick={handleLogin} disabled={loading} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '16px', fontSize: 16, marginTop: 8 }}>
            {loading ? 'Kirilmoqda...' : <><i className="fa-solid fa-right-to-bracket"></i> Kirish</>}
          </button>
        </div>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ──────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: COLORS.bg, minHeight: '100vh', color: 'white' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 30, right: 30, background: toastOk ? COLORS.success : COLORS.danger, color: 'white', padding: '16px 28px', borderRadius: 20, fontWeight: 700, zIndex: 99999, boxShadow: '0 15px 40px rgba(0,0,0,0.5)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className={`fa-solid ${toastOk ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '0 40px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <i className="fa-solid fa-gamepad" style={{ color: COLORS.primaryLight, fontSize: 28 }}></i>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>DOPPA <span style={{ color: COLORS.primaryLight }}>GAMES</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{adminInfo?.username?.charAt(0).toUpperCase() || 'A'}</div>
            <span style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: 600 }}>{adminInfo?.username || 'Admin'}</span>
          </div>
          
          <button onClick={() => { fetchMessages(); setModal('messages'); }} style={btnEdit}>
            <i className="fa-solid fa-envelope"></i> Xabarlar
          </button>
          <button onClick={() => { setSettingsForm({ ...settings }); setModal('settings'); }} style={btnEdit}>
            <i className="fa-solid fa-gear"></i> Sozlamalar
          </button>
          <button onClick={() => { setProfileForm({ ...adminInfo, password: '' }); setModal('profile'); }} style={btnEdit}>
            <i className="fa-solid fa-user-shield"></i> Profil
          </button>
          <a href="/" target="_blank" rel="noreferrer" style={{ ...btnEdit, textDecoration: 'none' }}>
            <i className="fa-solid fa-globe"></i> Sayt
          </a>
          <button onClick={logout} style={btnDanger}>
            <i className="fa-solid fa-right-from-bracket"></i> Chiqish
          </button>
        </div>
      </header>

      <div style={{ padding: '40px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 40 }}>
          {[
            { num: games.length, label: "Jami o'yinlar", icon: 'fa-gamepad', color: COLORS.primaryLight },
            { num: games.filter(g => g.status === 'released').length, label: 'Chiqarilgan', icon: 'fa-rocket', color: COLORS.success },
            { num: games.filter(g => g.status === 'upcoming').length, label: 'Kutilmoqda', icon: 'fa-calendar-days', color: COLORS.warning },
            { num: games.filter(g => g.featured).length, label: 'Tanlanganlar', icon: 'fa-star', color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.05, fontSize: 80 }}>
                <i className={`fa-solid ${s.icon}`}></i>
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className={`fa-solid ${s.icon}`} style={{ color: s.color }}></i>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>O'yinlar Kutubxonasi</h2>
              <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 14 }}>Barcha o'yinlarni boshqarish</p>
            </div>
            <button onClick={openAdd} style={{ ...btnPrimary, padding: '14px 28px', borderRadius: 16 }}>
              <i className="fa-solid fa-plus" style={{ fontSize: 18 }}></i> Yangi Loyiha
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr>
                  {['O\'YIN', 'HOLAT', 'PLATFORMA', 'Featured', 'AMALLAR'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 20px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {games.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 100, color: COLORS.textMuted }}>
                      <i className="fa-solid fa-ghost" style={{ fontSize: 60, opacity: 0.2, marginBottom: 20, display: 'block' }}></i>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>Hech qanday o'yin topilmadi</div>
                    </td>
                  </tr>
                ) : (
                  games.map((g) => (
                    <tr key={g.id}>
                      <td style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '16px 0 0 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          {g.img ? (
                            <img src={g.img} alt="" style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 12, border: `1px solid ${COLORS.border}` }} />
                          ) : (
                            <div style={{ width: 100, height: 56, background: 'rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="fa-solid fa-image" style={{ opacity: 0.2 }}></i>
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{g.name}</div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{g.release_date || 'Noma\'lum sana'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                          background: g.status === 'released' ? 'rgba(16,185,129,0.1)' : g.status === 'upcoming' ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                          color: g.status === 'released' ? COLORS.success : g.status === 'upcoming' ? COLORS.warning : COLORS.primaryLight
                        }}>
                          {g.status}
                        </span>
                      </td>
                      <td style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px', color: COLORS.textMuted, fontWeight: 600 }}>
                        {g.platform}
                      </td>
                      <td style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px' }}>
                        {g.featured ? 'Ha' : 'Yo\'q'}
                      </td>
                      <td style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '0 16px 16px 0' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(g)} style={btnEdit}><i className="fa-solid fa-pen"></i></button>
                          <button onClick={() => deleteGame(g.id, g.name)} style={btnDanger}><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <ModalWrap title={modal === 'edit' ? "Tahrirlash" : "Yangi Loyalty"} onSave={saveGame} onClose={() => setModal(null)} loading={loading}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1/-1' }}><Field label="Nomi *" value={form.name || ''} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <label style={labelStyle}>Platforma</label>
              <select value={form.platform || 'Steam'} onChange={e => setForm({ ...form, platform: e.target.value })} style={inputStyle}>
                <option>Steam</option><option>Mobile</option><option>PC</option><option>Web</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Holat</label>
              <select value={form.status || 'upcoming'} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="upcoming">Upcoming</option>
                <option value="released">Released</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}><Field label="Qisqa tavsif *" value={form.desc || ''} onChange={(e: any) => setForm({ ...form, desc: e.target.value })} /></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="To'liq tavsif" type="textarea" value={form.long_desc || ''} onChange={(e: any) => setForm({ ...form, long_desc: e.target.value })} /></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="Rasm URL" value={form.img || ''} onChange={(e: any) => setForm({ ...form, img: e.target.value })} /></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="URL" value={form.url || ''} onChange={(e: any) => setForm({ ...form, url: e.target.value })} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
              <label style={labelStyle}>Featured</label>
            </div>
          </div>
        </ModalWrap>
      )}

      {/* Settings Modal */}
      {modal === 'settings' && (
        <ModalWrap title="Sozlamalar" onSave={saveSettings} onClose={() => setModal(null)} loading={loading}>
          <Field label="Studio Nomi" value={settingsForm.studio_name || ''} onChange={(e: any) => setSettingsForm({ ...settingsForm, studio_name: e.target.value })} />
          <Field label="Email" value={settingsForm.email || ''} onChange={(e: any) => setSettingsForm({ ...settingsForm, email: e.target.value })} />
        </ModalWrap>
      )}

      {/* Profile Modal */}
      {modal === 'profile' && (
        <ModalWrap title="Profil" onSave={saveProfile} onClose={() => setModal(null)} loading={loading}>
          <Field label="Username" value={profileForm.username || ''} onChange={(e: any) => setProfileForm({ ...profileForm, username: e.target.value })} />
          <Field label="Yangi Parol" type="password" value={profileForm.password || ''} onChange={(e: any) => setProfileForm({ ...profileForm, password: e.target.value })} />
        </ModalWrap>
      )}

      {/* Messages Modal */}
      {modal === 'messages' && (
        <ModalWrap title="Xabarlar" onSave={() => setModal(null)} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m: any) => (
              <div key={m.id} style={{ border: `1px solid ${COLORS.border}`, padding: 16, borderRadius: 12 }}>
                <strong>{m.name}</strong> ({m.email})<br />
                {m.message}
              </div>
            ))}
          </div>
        </ModalWrap>
      )}
    </div>
  );
}
