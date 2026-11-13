"""Mikkels App - samler YouTube/podcasts (streaming), AI-nyt og quiz i én app.

Start:  python app.py      -> http://127.0.0.1:8770
Kræver: pip install flask yt-dlp feedparser requests
"""

from __future__ import annotations

import calendar
import html
import json
import os
import subprocess
import re
import shutil
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

import feedparser
import requests
import yt_dlp
from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).parent
app = Flask(__name__, static_folder=str(ROOT / "static"), static_url_path="")

HOST = os.environ.get("APP_HOST", "127.0.0.1")
PORT = int(os.environ.get("APP_PORT", "8770"))
UA = {"User-Agent": "MikkelsApp/1.0"}

# Mapper med gamle downloads (fra MikkelsYT) som "Ryd alt" kan tømme.
MEDIA_DIRS = [
    Path("~/storage/downloads/Medier").expanduser(),  # telefon (Termux)
    Path("~/Downloads/Medier").expanduser(),           # Windows
]


# ------------------------------------------------------------------ cache
_cache: dict[str, tuple[float, object]] = {}
_lock = threading.Lock()


def cached(key: str, ttl: int, fn):
    with _lock:
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < ttl:
            return hit[1]
    value = fn()
    with _lock:
        _cache[key] = (time.time(), value)
    return value


def strip_html(text: str, limit: int = 300) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"\s+", " ", html.unescape(text)).strip()
    return text[: limit - 1] + "…" if len(text) > limit else text


# ------------------------------------------------------------------ YouTube
def yt_search(q: str, n: int = 24) -> list[dict]:
    opts = {"quiet": True, "no_warnings": True, "extract_flat": "in_playlist",
            "skip_download": True, "socket_timeout": 15}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"ytsearch{n}:{q}", download=False)
    out = []
    for e in info.get("entries") or []:
        vid = e.get("id")
        if not vid or e.get("ie_key") not in (None, "Youtube"):
            continue
        out.append({
            "id": vid,
            "title": e.get("title") or "",
            "channel": e.get("channel") or e.get("uploader") or "",
            "duration": e.get("duration") or 0,
            "views": e.get("view_count") or 0,
            "thumb": f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
        })
    return out


@app.get("/api/yt/search")
def api_yt_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{11})", q)
    if m:  # indsat link -> afspil direkte
        return jsonify([{"id": m.group(1), "title": "Video fra link", "channel": "", "duration": 0,
                         "views": 0, "thumb": f"https://i.ytimg.com/vi/{m.group(1)}/mqdefault.jpg"}])
    try:
        return jsonify(cached("yt:" + q.lower(), 1800, lambda: yt_search(q)))
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Søgning fejlede: {exc}"}), 502


# ------------------------------------------------------------------ Podcasts
@app.get("/api/pod/search")
def api_pod_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])

    def fetch():
        r = requests.get("https://itunes.apple.com/search", headers=UA, timeout=15,
                         params={"term": q, "media": "podcast", "limit": 20, "country": "DK"})
        r.raise_for_status()
        return [{"id": p.get("collectionId"), "title": p.get("collectionName"),
                 "author": p.get("artistName"), "feed": p.get("feedUrl"),
                 "art": p.get("artworkUrl600") or p.get("artworkUrl100")}
                for p in r.json().get("results", []) if p.get("feedUrl")]
    try:
        return jsonify(cached("pod:" + q.lower(), 3600, fetch))
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Podcast-søgning fejlede: {exc}"}), 502


def parse_duration(v) -> int:
    if not v:
        return 0
    parts = str(v).split(":")
    try:
        secs = 0
        for p in parts:
            secs = secs * 60 + int(float(p))
        return secs
    except ValueError:
        return 0


@app.get("/api/pod/episodes")
def api_pod_episodes():
    feed = request.args.get("feed") or ""
    if not feed.startswith("http"):
        return jsonify({"error": "Ugyldigt feed"}), 400

    def fetch():
        r = requests.get(feed, headers=UA, timeout=20)
        d = feedparser.parse(r.content)
        eps = []
        for e in d.entries[:60]:
            audio = next((x.get("href") for x in e.get("enclosures", []) if x.get("href")), None) or \
                next((l.get("href") for l in e.get("links", [])
                      if l.get("rel") == "enclosure" or str(l.get("type", "")).startswith("audio")), None)
            if not audio:
                continue
            ts = e.get("published_parsed")
            eps.append({"title": e.get("title", ""), "audio": audio,
                        "date": calendar.timegm(ts) if ts else 0,
                        "duration": parse_duration(e.get("itunes_duration")),
                        "summary": strip_html(e.get("summary", ""), 220)})
        return {"title": d.feed.get("title", ""), "episodes": eps}
    try:
        return jsonify(cached("feed:" + feed, 900, fetch))
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Kunne ikke hente feed: {exc}"}), 502


# ------------------------------------------------------------------ AI-nyt
NEWS_FEEDS = {
    "Anthropic": "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml",
    "OpenAI": "https://openai.com/news/rss.xml",
    "Google DeepMind": "https://deepmind.google/blog/rss.xml",
    "Hugging Face": "https://huggingface.co/blog/feed.xml",
    "The Verge": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    "Simon Willison": "https://simonwillison.net/atom/everything/",
}

CATEGORIES = [
    # (kategori, nøgleord) - første match vinder
    ("Prøv selv", r"\b(how to|guide|tutorial|tips?|workflow|prompt|use case|hands-on|build(ing)? (a|an|your)|"
                  r"open[- ]source|plugin|extension|app|tool|feature|now available|agent|claude code|codex|cursor)\b"),
    ("Modeller", r"\b(model|gpt-?\d|claude|gemini|llama|mistral|qwen|deepseek|grok|release[sd]?|introducing|launch)"),
    ("Forskning", r"\b(research|paper|study|benchmark|interpretab|alignment|safety|dataset)\b"),
    ("Samfund", r"\b(law|regulat|lawsuit|court|jobs?|policy|ban|eu\b|copyright|election|school|student)"),
]


def categorize(text: str) -> str:
    t = text.lower()
    for name, pat in CATEGORIES:
        if re.search(pat, t):
            return name
    return "Andet"


def fetch_feed(source: str, url: str) -> list[dict]:
    try:
        r = requests.get(url, headers=UA, timeout=15)
        d = feedparser.parse(r.content)
    except Exception:  # noqa: BLE001
        return []
    out = []
    for e in d.entries[:25]:
        ts = e.get("published_parsed") or e.get("updated_parsed")
        title = strip_html(e.get("title", ""), 200)
        summary = strip_html(e.get("summary", ""), 260)
        out.append({"source": source, "title": title, "summary": summary, "link": e.get("link", ""),
                    "date": calendar.timegm(ts) if ts else 0, "points": 0,
                    "cat": categorize(title + " " + summary)})
    return out


def fetch_hn() -> list[dict]:
    """Det folk faktisk snakker om: HN-historier om AI med mange point, sidste 4 dage."""
    since = int(time.time()) - 4 * 86400
    try:
        r = requests.get("https://hn.algolia.com/api/v1/search", headers=UA, timeout=15, params={
            "query": "AI LLM", "tags": "story", "hitsPerPage": 40,
            "numericFilters": f"created_at_i>{since},points>80"})
        hits = r.json().get("hits", [])
    except Exception:  # noqa: BLE001
        return []
    out = []
    for h in hits:
        title = h.get("title") or ""
        out.append({"source": "Hacker News", "title": title, "summary": f"{h.get('points', 0)} point · "
                    f"{h.get('num_comments', 0)} kommentarer", "link": h.get("url") or
                    f"https://news.ycombinator.com/item?id={h['objectID']}",
                    "discuss": f"https://news.ycombinator.com/item?id={h['objectID']}",
                    "date": h.get("created_at_i", 0), "points": h.get("points", 0),
                    "cat": categorize(title)})
    return out


MARKETING = re.compile(r"(customer stor|case study|with (openai|codex|chatgpt|claude|gemini)\b|"
                       r"\b(doubles|rethink(s|ing)?|ships|transforms|scales|powers|reimagin\w*)\b.*\b(with|using)\b|partner(s|ship)? with)", re.I)


def score(item: dict) -> float:
    age_h = max(1.0, (time.time() - item["date"]) / 3600)
    if MARKETING.search(item["title"]):
        return 0.2 / (age_h / 24 + 1)  # kundehistorier/markedsføring = kedeligt
    base = {"Prøv selv": 3, "Samfund": 2, "Forskning": 1.5, "Modeller": 1.5, "Andet": 1}[item["cat"]]
    if item["source"] in ("Anthropic", "OpenAI", "Google DeepMind"):
        base += 1
    base += min(item["points"], 1500) / 250
    return base / (age_h / 24 + 1)


@app.get("/api/news")
def api_news():
    def build():
        with ThreadPoolExecutor(8) as pool:
            jobs = [pool.submit(fetch_feed, s, u) for s, u in NEWS_FEEDS.items()] + [pool.submit(fetch_hn)]
            items = [i for j in jobs for i in j.result()]
        cutoff = time.time() - 21 * 86400
        items = [i for i in items if i["date"] > cutoff and i["title"]]
        seen, uniq = set(), []
        for i in sorted(items, key=score, reverse=True):
            key = re.sub(r"\W+", "", i["title"].lower())[:50]
            if key not in seen:
                seen.add(key)
                uniq.append(i)
        return uniq
    if request.args.get("refresh"):
        _cache.pop("news", None)
    return jsonify(cached("news", 1800, build))


# ------------------------------------------------------------------ AI-events (via Claude Code = dit abonnement)
# Claude søger nettet med `claude -p` (Claude Code CLI). Den bruger dit Claude-login/abonnement,
# ikke en API-nøgle – derfor fjernes ANTHROPIC_API_KEY fra miljøet for kaldet.
DATA = ROOT / "data"
EVENTS_FILE = DATA / "events.json"
EVENTS_MAX_AGE = 3 * 86400       # søg automatisk igen efter 3 dage
EVENT_SCHEMA = {
    "type": "object", "required": ["events"],
    "properties": {"events": {"type": "array", "items": {
        "type": "object", "required": ["title", "date", "city", "online", "url", "organizer", "kind", "why"],
        "properties": {
            "title": {"type": "string"}, "date": {"type": "string", "description": "YYYY-MM-DD"},
            "time": {"type": "string", "description": "HH:MM eller tom"}, "city": {"type": "string"},
            "venue": {"type": "string"}, "online": {"type": "boolean"}, "url": {"type": "string"},
            "organizer": {"type": "string"}, "price": {"type": "string"},
            "kind": {"type": "string", "enum": ["Meetup", "Konference", "Hackathon", "Workshop", "Webinar", "Foredrag"]},
            "why": {"type": "string"}}}}},
}
_ev_state = {"refreshing": False, "error": None, "started": 0.0}


def _load_events() -> dict:
    try:
        return json.loads(EVENTS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"updated": 0, "events": []}


def _link_ok(url: str) -> bool:
    if not url.startswith("http"):
        return False
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0 MikkelsApp"}, timeout=10, allow_redirects=True)
        return r.status_code < 400 or r.status_code in (403, 429)  # nogle sider blokerer bots, men findes
    except requests.RequestException:
        return False


def _refresh_events():
    try:
        today = time.strftime("%Y-%m-%d")
        prompt = (ROOT / "events_prompt.md").read_text(encoding="utf-8").replace("{today}", today).replace("{days}", "60")
        claude = shutil.which("claude")
        if not claude:
            raise RuntimeError("Claude Code (claude) er ikke installeret på denne maskine")
        env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
        DATA.mkdir(exist_ok=True)
        proc = subprocess.run(
            [claude, "-p", prompt, "--model", "sonnet", "--output-format", "json",
             "--json-schema", json.dumps(EVENT_SCHEMA), "--allowedTools", "WebSearch WebFetch"],
            capture_output=True, text=True, encoding="utf-8", timeout=900, env=env, cwd=str(DATA))
        out = json.loads(proc.stdout or "{}")
        if out.get("is_error") or not isinstance(out.get("structured_output"), dict):
            raise RuntimeError(out.get("result") or proc.stderr[-300:] or "Claude svarede ikke")
        found = out["structured_output"].get("events", [])

        # Tjek: fremtidig dato + linket virker. Ellers smides eventet væk (ingen falske events).
        def keep(e):
            return e.get("date", "") >= today and re.fullmatch(r"\d{4}-\d{2}-\d{2}", e.get("date", "")) and _link_ok(e.get("url", ""))
        with ThreadPoolExecutor(8) as pool:
            ok = list(pool.map(keep, found))
        fresh = [dict(e, found=int(time.time())) for e, k in zip(found, ok) if k]
        # Flet med tidligere fund, så listen vokser over tid
        old = [e for e in _load_events()["events"] if e.get("date", "") >= today]
        by_url = {e["url"]: e for e in old}
        by_url.update({e["url"]: e for e in fresh})
        events = sorted(by_url.values(), key=lambda e: (e["date"], e.get("time") or ""))
        EVENTS_FILE.write_text(json.dumps({"updated": int(time.time()), "events": events,
                                           "dropped": len(found) - len(fresh)}, ensure_ascii=False, indent=1), encoding="utf-8")
        _ev_state["error"] = None
    except Exception as exc:  # noqa: BLE001
        _ev_state["error"] = str(exc)[:300]
    finally:
        _ev_state["refreshing"] = False


def _start_event_refresh():
    if _ev_state["refreshing"]:
        return
    _ev_state.update(refreshing=True, started=time.time(), error=None)
    threading.Thread(target=_refresh_events, daemon=True).start()


@app.get("/api/events")
def api_events():
    data = _load_events()
    today = time.strftime("%Y-%m-%d")
    data["events"] = [e for e in data["events"] if e.get("date", "") >= today]
    if time.time() - data.get("updated", 0) > EVENTS_MAX_AGE and not _ev_state["error"]:
        _start_event_refresh()
    return jsonify({**data, "refreshing": _ev_state["refreshing"], "error": _ev_state["error"]})


@app.post("/api/events/refresh")
def api_events_refresh():
    _start_event_refresh()
    return jsonify({"refreshing": True})


# ------------------------------------------------------------------ lager
def dir_size(p: Path) -> int:
    total = 0
    for root, _dirs, files in os.walk(p):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except OSError:
                pass
    return total


@app.get("/api/storage")
def api_storage():
    dirs = [{"path": str(d), "bytes": dir_size(d)} for d in MEDIA_DIRS if d.is_dir()]
    return jsonify({"dirs": dirs, "total": sum(d["bytes"] for d in dirs)})


@app.post("/api/storage/clear")
def api_storage_clear():
    freed = 0
    for d in MEDIA_DIRS:
        if not d.is_dir():
            continue
        for child in d.iterdir():
            size = dir_size(child) if child.is_dir() else child.stat().st_size
            try:
                shutil.rmtree(child) if child.is_dir() else child.unlink()
                freed += size
            except OSError:
                pass
    _cache.clear()
    return jsonify({"freed": freed})


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


# ------------------------------------------------------------------ like/dislike
# Gemmes i data/feedback.json, så Claude kan læse hvad Mikkel synes om, når appen skal forbedres.
FEEDBACK_FILE = DATA / "feedback.json"
_fb_lock = threading.Lock()


def _load_feedback() -> dict:
    try:
        return json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"votes": {}}


@app.get("/api/feedback")
def api_feedback_get():
    return jsonify(_load_feedback())


@app.post("/api/feedback")
def api_feedback_post():
    body = request.get_json(silent=True) or {}
    key = str(body.get("id", ""))[:80]
    vote = body.get("vote")
    if not key or vote not in (1, -1, 0):
        return jsonify({"error": "id og vote (1, -1 eller 0) kræves"}), 400
    with _fb_lock:
        fb = _load_feedback()
        if vote == 0:
            fb["votes"].pop(key, None)
        else:
            fb["votes"][key] = {"vote": vote, "kind": str(body.get("kind", ""))[:20], "title": str(body.get("title", ""))[:200],
                                "topic": str(body.get("topic", ""))[:40], "at": int(time.time())}
        DATA.mkdir(exist_ok=True)
        FEEDBACK_FILE.write_text(json.dumps(fb, ensure_ascii=False, indent=1), encoding="utf-8")
    return jsonify({"ok": True})


# ------------------------------------------------------------------ sikkerhed
# Serveren er kun til brug på denne maskine. Web-versionen (GitHub Pages) bruger ingen server.
LOCAL_HOSTS = {"127.0.0.1", "localhost"}


@app.before_request
def _only_local():
    # Afvis alt, der ikke er adresseret til localhost (også hvis APP_HOST ved en fejl er 0.0.0.0),
    # og afvis skrivninger fra andre hjemmesider (beskytter mod DNS rebinding og CSRF).
    if (request.host or "").rsplit(":", 1)[0].strip("[]") not in LOCAL_HOSTS:
        return jsonify({"error": "Kun lokal adgang"}), 403
    origin = request.headers.get("Origin")
    if request.method != "GET" and origin and urlparse(origin).hostname not in LOCAL_HOSTS:
        return jsonify({"error": "Fremmed oprindelse"}), 403
    return None


@app.after_request
def _security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resp


@app.get("/api/ping")
def api_ping():
    return jsonify({"ok": True})


# ------------------------------------------------------------------ fremgang: backup + så Claude kan se den
# Fremgangen fra den lokale app gemmes i data/progress.json.
PROGRESS_FILE = DATA / "progress.json"


def _load_progress() -> dict:
    try:
        return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"devices": {}}


@app.route("/api/progress", methods=["GET", "POST"])
def api_progress():
    if request.method == "GET":
        return jsonify(_load_progress())
    body = request.get_json(silent=True) or {}
    dev, data = str(body.get("device", ""))[:40], body.get("data")
    if not dev or not isinstance(data, dict) or len(json.dumps(data)) > 2_000_000:
        return jsonify({"error": "device og data kræves"}), 400
    with _fb_lock:
        pr = _load_progress()
        old = pr["devices"].get(dev, {})
        # Aldrig overskriv med mindre XP end før (fx efter ryddet browser) – så mistes intet.
        if old and (old.get("xp") or 0) > (body.get("xp") or 0):
            return jsonify({"ok": False, "kept": "older backup has more XP"})
        pr["devices"][dev] = {"label": str(body.get("label", ""))[:60], "xp": body.get("xp") or 0,
                              "updated": int(time.time()), "data": data}
        DATA.mkdir(exist_ok=True)
        PROGRESS_FILE.write_text(json.dumps(pr, ensure_ascii=False, indent=1), encoding="utf-8")
    return jsonify({"ok": True})


if __name__ == "__main__":
    print(f"Mikkels App kører på http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, threaded=True)
