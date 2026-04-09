import json
import os
from pathlib import Path

DB_FILE = Path(__file__).parent / "db.json"

DEFAULT_DB = {
    "games": [
        {
            "id": 1,
            "name": "Family Ties",
            "desc": "Oilaviy munosabatlar va mas'uliyat haqida chuqur o'yin. Steamda mavjud!",
            "long_desc": "Family Ties — bu oilaviy hayot, mojaro va muhabbat haqida hayajonli simulyator o'yin. Har bir qaroringiz oilangizning kelajagini belgilaydi. Steam'da o'ynang!",
            "tags": ["Simulation", "Indie", "Story Rich"],
            "platform": "Steam",
            "url": "https://store.steampowered.com/app/2675300/Family_Ties/",
            "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2675300/header.jpg",
            "status": "released",
            "release_date": "2024",
            "featured": True
        }
    ],
    "settings": {
        "studio_name": "Doppa Games",
        "tagline": "O'zbekistondagi eng innovatsion indie o'yin jamoasi",
        "email": "info@doppagames.uz",
        "telegram": "@doppagames",
        "instagram": "@doppagames"
    },
    "admin": {
        "username": "admin123",
        "password": "admin1234a",
        "admin_email": "admin@doppagames.uz",
        "admin_name": "Doppa Administrator"
    }
}


def load_db() -> dict:
    if not DB_FILE.exists():
        save_db(DEFAULT_DB)
        return DEFAULT_DB
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_db(data: dict):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_games() -> list:
    return load_db()["games"]


def get_game_by_id(game_id: int) -> dict | None:
    games = get_games()
    return next((g for g in games if g["id"] == game_id), None)


def create_game(game: dict) -> dict:
    db = load_db()
    games = db["games"]
    new_id = max((g["id"] for g in games), default=0) + 1
    game["id"] = new_id
    games.append(game)
    save_db(db)
    return game


def update_game(game_id: int, updates: dict) -> dict | None:
    db = load_db()
    games = db["games"]
    for i, g in enumerate(games):
        if g["id"] == game_id:
            games[i].update(updates)
            save_db(db)
            return games[i]
    return None


def delete_game(game_id: int) -> bool:
    db = load_db()
    games = db["games"]
    new_games = [g for g in games if g["id"] != game_id]
    if len(new_games) == len(games):
        return False
    db["games"] = new_games
    save_db(db)
    return True


def get_settings() -> dict:
    return load_db().get("settings", {})


def update_settings(updates: dict) -> dict:
    db = load_db()
    db["settings"].update(updates)
    save_db(db)
    return db["settings"]


def get_admin() -> dict:
    db = load_db()
    if "admin" not in db:
        db["admin"] = DEFAULT_DB["admin"]
        save_db(db)
    return db["admin"]


def update_admin(updates: dict) -> dict:
    db = load_db()
    if "admin" not in db:
        db["admin"] = DEFAULT_DB["admin"]
    db["admin"].update(updates)
    save_db(db)
    return db["admin"]
