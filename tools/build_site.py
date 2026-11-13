"""Bygger web-versionen til GitHub Pages i mappen _site.

Kopierer static/ og henter data på forhånd, så appen ikke behøver en server:
  data/yt.json      YouTube-forslag for alle søgninger i feedet (MOODS i app.js)
  data/news.json    AI-nyheder, sorteret som i appen
  data/events.json  AI-events fra site-data/events.json (opdateres fra PC'en med claude -p)

Kør:  python tools/build_site.py      (kører også automatisk i GitHub Actions)
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
sys.path.insert(0, str(ROOT))

import app as server  # noqa: E402  (Flask-appen, bruges via test-klienten)


def mood_queries() -> list[str]:
    """Læs søgningerne fra MOODS i app.js, så der kun er én liste at vedligeholde."""
    js = (ROOT / "static" / "app.js").read_text(encoding="utf-8")
    block = re.search(r"const MOODS = (\{.*?\n\});", js, re.S).group(1)
    out = subprocess.run(["node", "-e", f"const MOODS = {block}; process.stdout.write(JSON.stringify(MOODS))"],
                         capture_output=True, text=True, encoding="utf-8", check=True)
    moods = json.loads(out.stdout)
    return sorted({q for m in moods.values() for q in m["qs"]})


def main() -> int:
    if SITE.exists():
        shutil.rmtree(SITE)
    shutil.copytree(ROOT / "static", SITE)
    (SITE / "data").mkdir()
    (SITE / ".nojekyll").write_text("")
    client = server.app.test_client()

    # YouTube
    queries = mood_queries()

    def one(q):
        r = client.get("/api/yt/search", query_string={"q": q})
        return q, (r.get_json() if r.status_code == 200 else None)

    with ThreadPoolExecutor(6) as pool:
        results = dict(pool.map(one, queries))
    ok = {q: v for q, v in results.items() if isinstance(v, list) and v}
    failed = sorted(set(queries) - set(ok))
    print(f"YouTube: {len(ok)}/{len(queries)} søgninger, {sum(map(len, ok.values()))} videoer")
    if failed:
        print("  Fejlede:", ", ".join(failed[:10]))
    (SITE / "data" / "yt.json").write_text(json.dumps({"updated": int(time.time()), "queries": ok}, ensure_ascii=False), encoding="utf-8")

    # Nyheder
    r = client.get("/api/news")
    news = r.get_json() if r.status_code == 200 else []
    print(f"Nyheder: {len(news)}")
    (SITE / "data" / "news.json").write_text(json.dumps({"updated": int(time.time()), "items": news}, ensure_ascii=False), encoding="utf-8")

    # Events
    ev_src = ROOT / "site-data" / "events.json"
    events = json.loads(ev_src.read_text(encoding="utf-8")) if ev_src.exists() else {"events": [], "updated": 0}
    print(f"Events: {len(events.get('events', []))}")
    (SITE / "data" / "events.json").write_text(json.dumps(events, ensure_ascii=False), encoding="utf-8")

    # Fejl hvis næsten alt mangler, så en dårlig kørsel ikke erstatter en god side
    if len(ok) < len(queries) // 3 or not news:
        print("For lidt data – stopper, så den gamle version bliver liggende.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
