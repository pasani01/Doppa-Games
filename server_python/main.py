from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from pathlib import Path
import database as db

# ─────────────────────────────────────────
#  App setup
# ─────────────────────────────────────────
app = FastAPI(
    title="Doppa Games API",
    description="""
## 🎮 Doppa Games — Official Backend API

Bu API orqali **o'yinlar**, **sozlamalar** va **admin panel** bilan ishlash mumkin.

### Asosiy imkoniyatlar:
- 📋 O'yinlar ro'yxatini olish
- ➕ Yangi o'yin qo'shish (Admin)
- ✏️ O'yin ma'lumotlarini yangilash (Admin)
- 🗑️ O'yinni o'chirish (Admin)
- ⚙️ Studio sozlamalarini boshqarish (Admin)

### Admin kirish:
`X-Admin-Key: doppa-secret-2024` header'ini yuboring.
""",
    version="2.0.0",
    contact={
        "name": "Doppa Games",
        "url": "https://doppagames.uz",
        "email": "info@doppagames.uz",
    },
    license_info={
        "name": "Private",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

ADMIN_KEY = "doppa-secret-2024"

# ─────────────────────────────────────────
#  Schemas
# ─────────────────────────────────────────
class GameCreate(BaseModel):
    name: str
    desc: str
    long_desc: Optional[str] = ""
    tags: List[str] = []
    platform: Optional[str] = "PC"
    url: Optional[str] = ""
    img: Optional[str] = ""
    status: Optional[str] = "upcoming"  # released | upcoming | development
    release_date: Optional[str] = ""
    featured: Optional[bool] = False

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Space Doppa",
                "desc": "Kosmosda maceralar — yulduzlar orasida omon qol!",
                "long_desc": "Kengaytirilgan tavsif...",
                "tags": ["Action", "Arcade"],
                "platform": "Steam",
                "url": "https://store.steampowered.com/...",
                "img": "https://example.com/image.jpg",
                "status": "upcoming",
                "release_date": "2025",
                "featured": False
            }
        }
    }


class GameUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None
    long_desc: Optional[str] = None
    tags: Optional[List[str]] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    img: Optional[str] = None
    status: Optional[str] = None
    release_date: Optional[str] = None
    featured: Optional[bool] = None


class SettingsUpdate(BaseModel):
    studio_name: Optional[str] = None
    tagline: Optional[str] = None
    email: Optional[str] = None
    telegram: Optional[str] = None
    instagram: Optional[str] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminProfileUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None


# ─────────────────────────────────────────
#  Auth
# ─────────────────────────────────────────
def require_admin(x_admin_key: str = Header(..., description="Admin kalit: doppa-secret-2024")):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="❌ Admin kaliti noto'g'ri!"
        )
    return True

@app.post("/api/admin/login", tags=["Auth"])
async def admin_login(creds: AdminLogin):
    adm = db.get_admin()
    if creds.username == adm.get("username") and creds.password == adm.get("password"):
        return {"success": True, "token": ADMIN_KEY}
    raise HTTPException(status_code=401, detail="Noto'g'ri login yoki parol")

@app.put("/api/admin/profile", tags=["🔐 Admin — Settings"])
async def update_profile(updates: AdminProfileUpdate, _: bool = Depends(require_admin)):
    updated = db.update_admin({k: v for k, v in updates.model_dump().items() if v})
    return {"message": "✅ Profil yangilandi!", "admin": updated}


# ─────────────────────────────────────────
#  Public Endpoints
# ─────────────────────────────────────────
@app.get(
    "/api/games",
    tags=["🎮 Games — Public"],
    summary="Barcha o'yinlar ro'yxati",
    response_description="O'yinlar massivi"
)
async def get_all_games():
    """
    Barcha chiqarilgan va kelgusi o'yinlar ro'yxatini qaytaradi.
    Frontend uchun asosiy endpoint.
    """
    return db.get_games()


@app.get(
    "/api/games/{game_id}",
    tags=["🎮 Games — Public"],
    summary="Bitta o'yin ma'lumoti",
)
async def get_game(game_id: int):
    """ID bo'yicha bitta o'yin ma'lumotini qaytaradi."""
    game = db.get_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"O'yin #{game_id} topilmadi")
    return game


@app.get(
    "/api/settings",
    tags=["⚙️ Settings — Public"],
    summary="Studio sozlamalari",
)
async def get_settings():
    """Studio aloqa ma'lumotlari va sozlamalarini qaytaradi."""
    return db.get_settings()


# ─────────────────────────────────────────
#  Admin Endpoints
# ─────────────────────────────────────────
@app.post(
    "/api/admin/games",
    tags=["🔐 Admin — Games"],
    summary="Yangi o'yin qo'shish",
    status_code=201,
)
async def create_game(game: GameCreate, _: bool = Depends(require_admin)):
    """
    **Admin only.** Yangi o'yin yaratadi.
    Header: `X-Admin-Key: doppa-secret-2024`
    """
    new_game = db.create_game(game.model_dump())
    return {"message": "✅ O'yin muvaffaqiyatli qo'shildi!", "game": new_game}


@app.put(
    "/api/admin/games/{game_id}",
    tags=["🔐 Admin — Games"],
    summary="O'yin ma'lumotlarini yangilash",
)
async def update_game(game_id: int, updates: GameUpdate, _: bool = Depends(require_admin)):
    """
    **Admin only.** O'yin ma'lumotlarini yangilaydi (partial update).
    Faqat yuborilgan maydonlar yangilanadi.
    Header: `X-Admin-Key: doppa-secret-2024`
    """
    updated = db.update_game(game_id, {k: v for k, v in updates.model_dump().items() if v is not None})
    if not updated:
        raise HTTPException(status_code=404, detail=f"O'yin #{game_id} topilmadi")
    return {"message": "✅ O'yin yangilandi!", "game": updated}


@app.delete(
    "/api/admin/games/{game_id}",
    tags=["🔐 Admin — Games"],
    summary="O'yinni o'chirish",
)
async def delete_game(game_id: int, _: bool = Depends(require_admin)):
    """
    **Admin only.** O'yinni o'chiradi.
    Header: `X-Admin-Key: doppa-secret-2024`
    """
    success = db.delete_game(game_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"O'yin #{game_id} topilmadi")
    return {"message": f"✅ O'yin #{game_id} o'chirildi!"}


@app.put(
    "/api/admin/games/{game_id}/image",
    tags=["🔐 Admin — Games"],
    summary="O'yin rasmini yangilash (URL orqali)",
)
async def update_game_image(
    game_id: int,
    img_url: str,
    _: bool = Depends(require_admin)
):
    """
    **Admin only.** O'yin rasmini yangi URL bilan almashtiradi.
    Header: `X-Admin-Key: doppa-secret-2024`
    
    - **img_url**: Yangi rasm URL manzili (CDN, Steam, yoki boshqa)
    """
    updated = db.update_game(game_id, {"img": img_url})
    if not updated:
        raise HTTPException(status_code=404, detail=f"O'yin #{game_id} topilmadi")
    return {"message": "✅ Rasm yangilandi!", "img": img_url}


@app.put(
    "/api/admin/settings",
    tags=["🔐 Admin — Settings"],
    summary="Studio sozlamalarini yangilash",
)
async def update_settings(settings: SettingsUpdate, _: bool = Depends(require_admin)):
    """
    **Admin only.** Studio aloqa va branding ma'lumotlarini yangilaydi.
    Header: `X-Admin-Key: doppa-secret-2024`
    """
    updated = db.update_settings({k: v for k, v in settings.model_dump().items() if v is not None})
    return {"message": "✅ Sozlamalar yangilandi!", "settings": updated}


# ─────────────────────────────────────────
#  Admin Panel (Web UI)
# ─────────────────────────────────────────
@app.get("/admin", response_class=HTMLResponse, include_in_schema=False)
async def admin_panel():
    """Admin panel HTML interfeysi"""
    games = db.get_games()
    settings = db.get_settings()
    admin = db.get_admin()

    games_rows = ""
    for g in games:
        status_badge = {
            "released": '<span class="badge released">Released</span>',
            "upcoming": '<span class="badge upcoming">Upcoming</span>',
            "development": '<span class="badge dev">In Dev</span>',
        }.get(g.get("status", ""), '<span class="badge">?</span>')

        games_rows += f"""
        <tr>
          <td>{g['id']}</td>
          <td>
            {'<img src="' + g['img'] + '" alt="img" />' if g.get('img') else '<span class="no-img">No Image</span>'}
          </td>
          <td><strong>{g['name']}</strong></td>
          <td>{g['desc'][:60]}...</td>
          <td>{', '.join(g.get('tags', []))}</td>
          <td>{status_badge}</td>
          <td>
            <a href="{g.get('url','#')}" target="_blank" class="btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open</a>
            <button class="btn-sm btn-edit" onclick="editGame({g['id']})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn-sm btn-danger" onclick="deleteGame({g['id']}, '{g['name']}')"><i class="fa-solid fa-trash"></i> Del</button>
          </td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Doppa Games — Admin Panel</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  :root {{
    --bg: #0f0f1a; --card: #1a1a2e; --border: #2d2d44;
    --primary: #8B5CF6; --primary-light: #A78BFA;
    --success: #10b981; --danger: #ef4444; --warn: #f59e0b;
    --text: #e2e8f0; --muted: #94a3b8;
  }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }}
  header {{ background:var(--card); border-bottom:1px solid var(--border); padding:20px 40px;
    display:flex; align-items:center; justify-content:space-between; }}
  header h1 {{ font-size:22px; font-weight:700; color:var(--primary-light); }}
  header p {{ font-size:13px; color:var(--muted); }}
  .container {{ padding:40px; max-width:1500px; margin:0 auto; }}
  .stats {{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:40px; }}
  .stat-card {{ background:var(--card); border:1px solid var(--border); border-radius:16px; padding:24px; }}
  .stat-card .num {{ font-size:36px; font-weight:700; color:var(--primary-light); }}
  .stat-card .lbl {{ font-size:13px; color:var(--muted); margin-top:4px; }}
  .card {{ background:var(--card); border:1px solid var(--border); border-radius:20px; padding:32px; margin-bottom:30px; }}
  .card h2 {{ font-size:18px; margin-bottom:24px; display:flex; align-items:center; gap:10px; }}
  table {{ width:100%; border-collapse:collapse; }}
  th {{ text-align:left; padding:12px 16px; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--muted); border-bottom:1px solid var(--border); }}
  td {{ padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:14px; vertical-align:middle; }}
  td img {{ width:70px; height:40px; object-fit:cover; border-radius:8px; }}
  .badge {{ padding:4px 12px; border-radius:100px; font-size:11px; font-weight:600; }}
  .released {{ background:rgba(16,185,129,0.15); color:var(--success); }}
  .upcoming {{ background:rgba(245,158,11,0.15); color:var(--warn); }}
  .dev {{ background:rgba(139,92,246,0.15); color:var(--primary-light); }}
  .no-img {{ font-size:11px; color:var(--muted); }}
  .btn-sm {{ padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-size:12px; font-weight:600;
    background:rgba(255,255,255,0.07); color:var(--text); transition:all 0.2s; margin-right:6px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }}
  .btn-sm:hover {{ background:rgba(255,255,255,0.15); }}
  .btn-danger {{ background:rgba(239,68,68,0.15)!important; color:var(--danger)!important; }}
  .btn-edit {{ background:rgba(139,92,246,0.15)!important; color:var(--primary-light)!important; }}
  .form-grid {{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }}
  .form-group {{ display:flex; flex-direction:column; gap:8px; }}
  .form-group.full {{ grid-column:1/-1; }}
  label {{ font-size:13px; font-weight:500; color:var(--muted); }}
  input, select, textarea {{ background:rgba(255,255,255,0.05); border:1px solid var(--border);
    border-radius:12px; padding:12px 16px; color:var(--text); font-family:inherit; font-size:14px;
    transition:border-color 0.2s; width:100%; }}
  input:focus, select:focus, textarea:focus {{ outline:none; border-color:var(--primary); }}
  select option {{ background:#1a1a2e; }}
  .btn-primary {{ background:var(--primary); color:white; border:none; padding:14px 28px;
    border-radius:12px; font-weight:700; font-size:15px; cursor:pointer; transition:all 0.3s; margin-top:8px; display:inline-flex; align-items:center; gap:8px; justify-content:center; }}
  .btn-primary:hover {{ transform:translateY(-2px); box-shadow:0 8px 20px rgba(139,92,246,0.4); }}
  .api-link {{ display:inline-flex; align-items:center; gap:8px; padding:10px 20px;
    background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.3);
    border-radius:12px; color:var(--primary-light); font-size:14px; font-weight:600; text-decoration:none; cursor:pointer; }}
  .api-link:hover {{ background:rgba(139,92,246,0.2); }}
  .toast {{ position:fixed; bottom:30px; right:30px; background:var(--success);
    color:white; padding:16px 24px; border-radius:16px; font-weight:600; opacity:0;
    transform:translateY(10px); transition:all 0.3s; z-index:9999; }}
  .toast.show {{ opacity:1; transform:translateY(0); }}
  .modal-overlay {{ position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px);
    z-index:1000; display:none; align-items:center; justify-content:center; }}
  .modal-overlay.open {{ display:flex; }}
  .modal {{ background:var(--card); border:1px solid var(--border); border-radius:24px;
    padding:40px; width:90%; max-width:600px; max-height:90vh; overflow-y:auto; }}

  .modal h3 {{ font-size:20px; margin-bottom:24px; }}
  .modal-close {{ float:right; background:none; border:none; color:var(--muted); font-size:22px; cursor:pointer; }}
</style>
</head>
<body>

<header>
  <div>
    <h1><i class="fa-solid fa-gamepad"></i> Doppa Games — Admin</h1>
    <p>Xush kelibsiz, <b>{admin.get('admin_name', 'Admin')}</b>!</p>
  </div>
  <div style="display:flex;gap:12px;">
    <button class="api-link" onclick="document.getElementById('settingsModal').classList.add('open')"><i class="fa-solid fa-gear"></i> Studio Sozlamalari</button>
    <button class="api-link" onclick="document.getElementById('profileModal').classList.add('open')"><i class="fa-solid fa-user-shield"></i> Admin User</button>
    <a class="api-link" href="/docs" target="_blank"><i class="fa-solid fa-book"></i> Swagger Docs</a>
  </div>
</header>

<div class="container">

  <!-- Stats -->
  <div class="stats">
    <div class="stat-card">
      <div class="num">{len(games)}</div>
      <div class="lbl">Jami o'yinlar</div>
    </div>
    <div class="stat-card">
      <div class="num" style="color:#10b981">{sum(1 for g in games if g.get('status')=='released')}</div>
      <div class="lbl">Chiqarilgan</div>
    </div>
    <div class="stat-card">
      <div class="num" style="color:#f59e0b">{sum(1 for g in games if g.get('status')=='upcoming')}</div>
      <div class="lbl">Kelgusi</div>
    </div>
    <div class="stat-card">
      <div class="num" style="color:#A78BFA">{sum(1 for g in games if g.get('featured'))}</div>
      <div class="lbl">Featured</div>
    </div>
  </div>

  <!-- Games Table -->
  <div class="card">
    <h2><i class="fa-solid fa-gamepad"></i> O'yinlar ro'yxati
      <button class="btn-sm btn-edit" style="margin-left:auto" onclick="document.getElementById('addModal').classList.add('open')"><i class="fa-solid fa-plus"></i> Yangi o'yin</button>
    </h2>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Rasm</th><th>Nomi</th><th>Tavsif</th><th>Teglar</th><th>Status</th><th>Amallar</th>
        </tr>
      </thead>
      <tbody>{games_rows if games_rows else '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:40px">Hali o\'yin yo\'q</td></tr>'}</tbody>
    </table>
  </div>

  </div>
</div>

<!-- Studio Settings Modal -->
<div class="modal-overlay" id="settingsModal">
  <div class="modal">
    <button class="modal-close" onclick="document.getElementById('settingsModal').classList.remove('open')">×</button>
    <h3><i class="fa-solid fa-gear"></i> Studio Sozlamalari</h3>
    <form id="settingsForm" onsubmit="saveSettings(event)">
      <div class="form-grid">
        <div class="form-group">
          <label>Studio nomi</label>
          <input id="s_name" value="{settings.get('studio_name','')}" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input id="s_email" value="{settings.get('email','')}" />
        </div>
        <div class="form-group">
          <label>Telegram</label>
          <input id="s_telegram" value="{settings.get('telegram','')}" />
        </div>
        <div class="form-group">
          <label>Instagram</label>
          <input id="s_instagram" value="{settings.get('instagram','')}" />
        </div>
        <div class="form-group full">
          <label>Tagline</label>
          <input id="s_tagline" value="{settings.get('tagline','')}" />
        </div>
      </div>
      <button type="submit" class="btn-primary" style="width:100%"><i class="fa-solid fa-floppy-disk"></i> Saqlash</button>
    </form>
  </div>
</div>

<!-- Admin Profile Modal -->
<div class="modal-overlay" id="profileModal">
  <div class="modal">
    <button class="modal-close" onclick="document.getElementById('profileModal').classList.remove('open')">×</button>
    <h3><i class="fa-solid fa-user-shield"></i> Admin User Boshqaruvi</h3>
    <form onsubmit="saveProfile(event)">
      <div class="form-grid">
        <div class="form-group full">
          <label>Ism-sharif</label>
          <input id="p_name" value="{admin.get('admin_name','')}" />
        </div>
        <div class="form-group full">
          <label>Email</label>
          <input id="p_email" value="{admin.get('admin_email','')}" type="email" />
        </div>
        <div class="form-group">
          <label>Login Username</label>
          <input id="p_user" value="{admin.get('username','')}" required />
        </div>
        <div class="form-group">
          <label>Yangi parolni kiriting</label>
          <input id="p_pass" type="password" placeholder="(O'zgartirmaslik uchun bo'sh qoldiring)" />
        </div>
      </div>
      <button type="submit" class="btn-primary" style="width:100%"><i class="fa-solid fa-floppy-disk"></i> Parol/Profil Saqlash</button>
    </form>
  </div>


<!-- Add Game Modal -->
<div class="modal-overlay" id="addModal">
  <div class="modal">
    <button class="modal-close" onclick="document.getElementById('addModal').classList.remove('open')">×</button>
    <h3><i class="fa-solid fa-plus"></i> Yangi o'yin qo'shish</h3>
    <form onsubmit="addGame(event)">
      <div class="form-grid">
        <div class="form-group">
          <label>Nomi *</label>
          <input id="n_name" required />
        </div>
        <div class="form-group">
          <label>Platform</label>
          <select id="n_platform">
            <option>Steam</option><option>Mobile</option><option>Web</option><option>PC</option>
          </select>
        </div>
        <div class="form-group full">
          <label>Qisqa tavsif *</label>
          <input id="n_desc" required />
        </div>
        <div class="form-group full">
          <label>To'liq tavsif</label>
          <textarea id="n_long_desc" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>Teglar (vergul bilan)</label>
          <input id="n_tags" placeholder="Action, RPG, Indie" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="n_status">
            <option value="upcoming">Upcoming</option>
            <option value="released">Released</option>
            <option value="development">In Development</option>
          </select>
        </div>
        <div class="form-group full">
          <label>Rasm URL</label>
          <input id="n_img" placeholder="https://..." />
        </div>
        <div class="form-group full">
          <label>O'yin URL (Steam/web)</label>
          <input id="n_url" placeholder="https://store.steampowered.com/..." />
        </div>
        <div class="form-group">
          <label>Chiqarilgan yil</label>
          <input id="n_date" placeholder="2025" />
        </div>
        <div class="form-group" style="justify-content:flex-end;align-items:flex-start;padding-top:24px">
          <label style="display:flex;gap:10px;align-items:center">
            <input type="checkbox" id="n_featured" style="width:auto" /> Featured qilish
          </label>
        </div>
      </div>
      <button type="submit" class="btn-primary" style="width:100%">✅ Qo'shish</button>
    </form>
  </div>
</div>

<!-- Edit Game Modal -->
<div class="modal-overlay" id="editModal">
  <div class="modal">
    <button class="modal-close" onclick="document.getElementById('editModal').classList.remove('open')">×</button>
    <h3><i class="fa-solid fa-pen"></i> O'yinni tahrirlash</h3>
    <form onsubmit="saveEdit(event)">
      <input type="hidden" id="e_id" />
      <div class="form-grid">
        <div class="form-group"><label>Nomi</label><input id="e_name" /></div>
        <div class="form-group"><label>Platform</label>
          <select id="e_platform"><option>Steam</option><option>Mobile</option><option>Web</option><option>PC</option></select>
        </div>
        <div class="form-group full"><label>Qisqa tavsif</label><input id="e_desc" /></div>
        <div class="form-group full"><label>To'liq tavsif</label><textarea id="e_long_desc" rows="3"></textarea></div>
        <div class="form-group"><label>Teglar (vergul bilan)</label><input id="e_tags" /></div>
        <div class="form-group"><label>Status</label>
          <select id="e_status">
            <option value="upcoming">Upcoming</option>
            <option value="released">Released</option>
            <option value="development">In Development</option>
          </select>
        </div>
        <div class="form-group full"><label>Rasm URL</label><input id="e_img" /></div>
        <div class="form-group full"><label>O'yin URL</label><input id="e_url" /></div>
        <div class="form-group"><label>Yil</label><input id="e_date" /></div>
        <div class="form-group" style="justify-content:flex-end;align-items:flex-start;padding-top:24px">
          <label style="display:flex;gap:10px;align-items:center">
            <input type="checkbox" id="e_featured" style="width:auto" /> Featured
          </label>
        </div>
      </div>
      <button type="submit" class="btn-primary" style="width:100%"><i class="fa-solid fa-floppy-disk"></i> Saqlash</button>
    </form>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const ADMIN_KEY = 'doppa-secret-2024';
const H = {{'Content-Type':'application/json','X-Admin-Key':ADMIN_KEY}};

function showToast(msg, ok=true) {{
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.style.background = ok ? 'var(--success)' : 'var(--danger)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}}

async function addGame(e) {{
  e.preventDefault();
  const body = {{
    name: document.getElementById('n_name').value,
    desc: document.getElementById('n_desc').value,
    long_desc: document.getElementById('n_long_desc').value,
    tags: document.getElementById('n_tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    platform: document.getElementById('n_platform').value,
    status: document.getElementById('n_status').value,
    img: document.getElementById('n_img').value,
    url: document.getElementById('n_url').value,
    release_date: document.getElementById('n_date').value,
    featured: document.getElementById('n_featured').checked,
  }};
  const r = await fetch('/api/admin/games', {{method:'POST',headers:H,body:JSON.stringify(body)}});
  if (r.ok) {{ showToast("<i class='fa-solid fa-check'></i> O'yin qo'shildi!"); setTimeout(()=>location.reload(),1200); }}
  else {{ const err = await r.json(); showToast("<i class='fa-solid fa-triangle-exclamation'></i> Xato: "+err.detail, false); }}
}}

async function editGame(id) {{
  const r = await fetch('/api/games/'+id);
  const g = await r.json();
  document.getElementById('e_id').value = g.id;
  document.getElementById('e_name').value = g.name||'';
  document.getElementById('e_desc').value = g.desc||'';
  document.getElementById('e_long_desc').value = g.long_desc||'';
  document.getElementById('e_tags').value = (g.tags||[]).join(', ');
  document.getElementById('e_platform').value = g.platform||'PC';
  document.getElementById('e_status').value = g.status||'upcoming';
  document.getElementById('e_img').value = g.img||'';
  document.getElementById('e_url').value = g.url||'';
  document.getElementById('e_date').value = g.release_date||'';
  document.getElementById('e_featured').checked = g.featured||false;
  document.getElementById('editModal').classList.add('open');
}}

async function saveEdit(e) {{
  e.preventDefault();
  const id = document.getElementById('e_id').value;
  const body = {{
    name: document.getElementById('e_name').value,
    desc: document.getElementById('e_desc').value,
    long_desc: document.getElementById('e_long_desc').value,
    tags: document.getElementById('e_tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    platform: document.getElementById('e_platform').value,
    status: document.getElementById('e_status').value,
    img: document.getElementById('e_img').value,
    url: document.getElementById('e_url').value,
    release_date: document.getElementById('e_date').value,
    featured: document.getElementById('e_featured').checked,
  }};
  const r = await fetch('/api/admin/games/'+id, {{method:'PUT',headers:H,body:JSON.stringify(body)}});
  if (r.ok) {{ showToast("<i class='fa-solid fa-check'></i> O'yin yangilandi!"); setTimeout(()=>location.reload(),1200); }}
  else {{ const err = await r.json(); showToast("<i class='fa-solid fa-triangle-exclamation'></i> Xato: "+err.detail, false); }}
}}

async function deleteGame(id, name) {{
  if (!confirm('"' + name + '" o\'yinni o\'chirmoqchimisiz?')) return;
  const r = await fetch('/api/admin/games/'+id, {{method:'DELETE',headers:{{'X-Admin-Key':ADMIN_KEY}}}});
  if (r.ok) {{ showToast("<i class='fa-solid fa-trash'></i> O'chirildi!"); setTimeout(()=>location.reload(),1200); }}
  else {{ showToast("<i class='fa-solid fa-triangle-exclamation'></i> Xato!", false); }}
}}

async function saveSettings(e) {{
  e.preventDefault();
  const body = {{
    studio_name: document.getElementById('s_name').value,
    email: document.getElementById('s_email').value,
    telegram: document.getElementById('s_telegram').value,
    instagram: document.getElementById('s_instagram').value,
    tagline: document.getElementById('s_tagline').value,
  }};
  const r = await fetch('/api/admin/settings', {{method:'PUT',headers:H,body:JSON.stringify(body)}});
  if (r.ok) {{ showToast("<i class='fa-solid fa-gear'></i> Sozlamalar saqlandi!"); document.getElementById('settingsModal').classList.remove('open'); setTimeout(()=>location.reload(),800); }}
  else showToast("<i class='fa-solid fa-triangle-exclamation'></i> Xato!", false);
}}

async function saveProfile(e) {{
  e.preventDefault();
  const body = {{
    username: document.getElementById('p_user').value,
    admin_name: document.getElementById('p_name').value,
    admin_email: document.getElementById('p_email').value,
    password: document.getElementById('p_pass').value || null
  }};
  const r = await fetch('/api/admin/profile', {{method:'PUT',headers:H,body:JSON.stringify(body)}});
  if (r.ok) {{ showToast("<i class='fa-solid fa-user-shield'></i> Admin profil yangilandi!"); document.getElementById('profileModal').classList.remove('open'); setTimeout(()=>location.reload(),800); }}
  else showToast("<i class='fa-solid fa-triangle-exclamation'></i> Xato!", false);
}}
</script>
</body>
</html>"""


# ─────────────────────────────────────────
#  Root redirect
# ─────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({"message": "🎮 Doppa Games API v2.0", "admin": "/admin", "docs": "/docs"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
