"""Review-bot: gennemgår kategorierne i EVALS.md og skriver en rapport.

    python evals/run_evals.py            # alle automatiske tjek
    python evals/run_evals.py --judge    # + Claude faktatjekker hvert spørgsmål (koster lidt)

Kategori 6, 7 og 10 kræver at serveren kører (python app.py).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
BASE = "http://127.0.0.1:8770"

# Eksamensemner. DOA: fra de skriftlige sæt 2022-2026. SYS: "Eksamensemner SW3SYS.md".
DOA_EXAM_TOPICS = {
    "Algoritmeanalyse / Big-O": "bigo", "Søgning": "search", "Lister (linked list, removeAll)": "lists",
    "Hashing (E/O/D, probing)": "hash", "Rekursion": "rec", "Sortering / algoritme-modifikation": "sort",
    "Heaps / prioritetskøer": "heap", "BST": "bst", "AVL": "avl", "Grafer, BFS/DFS": "graph",
    "Dijkstra / A*": "dijkstra", "MST / Prim": "mst", "Strengsøgning (KMP, Rabin-Karp)": "strings",
}
SYS_EXAM_TOPICS = {
    "Basis": "basis", "1 Process Control & IPC": "proc", "2 Higher-Order Functions & Lambdas": "lambda",
    "3 Threads & Concurrency": "threads", "4 Synchronization Tools": "sync", "5 Deadlocks": "deadlock",
    "6 POSIX File I/O": "fileio", "7 Message Passing & Queues": "msg", "8 Serial I/O (I2C/SPI)": "serial",
    "9 Memory Management & Interrupts": "mem", "10 RAII & smart pointers": "raii",
    "11 Linux Device Drivers": "driver", "12 Build Systems": "build",
}
PLACEHOLDER = re.compile(r"(TODO|FIXME|nej vent|lorem|xxx|\?\?\?$)", re.I)


def load_courses() -> list:
    js = (STATIC / "quiz-data.js").read_text(encoding="utf-8")
    out = subprocess.run(["node"], input=js + "\nprocess.stdout.write(JSON.stringify(COURSES))",
                         capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


def all_questions(courses):
    for c in courses:
        for u in c["units"]:
            for i, q in enumerate(u["questions"]):
                yield c, u, i, q


def get(path: str, timeout=60):
    t0 = time.time()
    with urlopen(BASE + path, timeout=timeout) as r:
        data = json.loads(r.read())
    return data, time.time() - t0


# ------------------------------------------------------------------ tjek
def check_factual(courses, judge):
    """1. Genberegn de spørgsmål der kan regnes; evt. Claude-dommer på alle."""
    issues = []

    def djb(s):
        h = 5381
        for ch in s:
            h = h * 33 + ord(ch)
        return h
    recompute = [
        ("djb2('go') mod 7 = 2", djb("go") % 7 == 2),
        ("10·31 mod 7 = 2", 10 * 31 % 7 == 2), ("5·31 mod 7 = 1", 5 * 31 % 7 == 1), ("13·31 mod 7 = 4", 13 * 31 % 7 == 4),
        ("Amdahl 75 %/4 kerner ≈ 2,29", abs(1 / (0.25 + 0.75 / 4) - 2.2857) < 0.01),
        ("0x3A7F → side 0x3, offset 0xA7F", (0x3A7F >> 12, 0x3A7F & 0xFFF) == (3, 0xA7F)),
    ]
    import heapq
    h = []
    for x in [5, 3, 8, 1]:
        heapq.heappush(h, x)
    recompute.append(("min-heap af 5,3,8,1 = [1,3,8,5]", h == [1, 3, 8, 5]))
    a = [3, 1, 4, 1, 5, 9, 2]
    for j in range(len(a) - 1):
        if a[j] > a[j + 1]:
            a[j], a[j + 1] = a[j + 1], a[j]
    recompute.append(("bubble pass 1 = [1,3,1,4,5,2,9]", a == [1, 3, 1, 4, 5, 2, 9]))
    def lps(pat):
        t, k = [0] * len(pat), 0
        for i in range(1, len(pat)):
            while k and pat[i] != pat[k]:
                k = t[k - 1]
            if pat[i] == pat[k]:
                k += 1
            t[i] = k
        return t
    recompute += [
        ("LPS(abaa) = [0,0,1,1]", lps("abaa") == [0, 0, 1, 1]), ("LPS(212) = [0,0,1]", lps("212") == [0, 0, 1]),
        ("LPS(aabaaab) = [0,1,0,1,2,2,3]", lps("aabaaab") == [0, 1, 0, 1, 2, 2, 3]),
        ("'abaa' i 'ababcabaa' ved index 5", "ababcabaa".find("abaa") == 5), ("212 mod 23 = 5", 212 % 23 == 5),
    ]
    issues += [f"Genberegning fejlede: {n}" for n, ok in recompute if not ok]

    note = f"{len(recompute)} genberegninger"
    if judge:
        judged, flagged = run_judge(courses)
        issues += flagged
        note += f", Claude vurderede {judged} spørgsmål"
    else:
        note += " (kør med --judge for fuldt faktatjek)"
    return not issues, note, issues


JUDGE_SCHEMA = {
    "type": "object",
    "properties": {"results": {"type": "array", "items": {
        "type": "object",
        "properties": {"index": {"type": "integer"}, "ok": {"type": "boolean"}, "problem": {"type": "string"}},
        "required": ["index", "ok", "problem"], "additionalProperties": False}}},
    "required": ["results"], "additionalProperties": False,
}
JUDGE_SYSTEM = ("Du er censor i Algoritmer og datastrukturer og Systemprogrammering (Linux, C++, POSIX) på Aarhus Universitet. "
                "Du faktatjekker multiple choice-spørgsmål. For hvert spørgsmål: er svarmulighed nummer `a` (0-indekseret) korrekt, "
                "er de andre muligheder faktisk forkerte, og er forklaringen `e` korrekt? Regn selv efter ved beregninger. "
                "Sæt ok=false kun ved en reel faglig fejl eller tvetydighed, og beskriv den kort på dansk i problem. Ellers problem=\"\". "
                "Returner ét resultat pr. spørgsmål.")


def _judge_api(user_msg):
    """Claude API (kræver ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN og en nyere anthropic-pakke)."""
    import anthropic
    resp = anthropic.Anthropic().beta.messages.create(
        model="claude-opus-5-5", max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"], fallbacks="default",
        system=JUDGE_SYSTEM,
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": JUDGE_SCHEMA}},
        messages=[{"role": "user", "content": user_msg}],
    )
    if resp.stop_reason == "refusal":
        return None
    return json.loads(next(b.text for b in resp.content if b.type == "text"))


def _judge_cli(user_msg):
    """Claude Code (`claude -p`) – bruger dit Claude-login/abonnement, ingen API-nøgle."""
    import shutil
    import tempfile
    exe = shutil.which("claude")
    if not exe:
        raise RuntimeError("Hverken API-nøgle eller Claude Code (claude) fundet")
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    with tempfile.TemporaryDirectory() as tmp:  # tom mappe: dommeren skal ikke læse projektfiler
        proc = subprocess.run(
            [exe, "-p", "--model", "opus", "--effort", "high", "--output-format", "json",
             "--system-prompt", JUDGE_SYSTEM, "--json-schema", json.dumps(JUDGE_SCHEMA),
             "--no-session-persistence"],
            input=user_msg, capture_output=True, text=True, encoding="utf-8", timeout=1500, env=env, cwd=tmp)
    out = json.loads(proc.stdout or "{}")
    if out.get("is_error") or not isinstance(out.get("structured_output"), dict):
        raise RuntimeError(out.get("result") or proc.stderr[-300:] or "Claude svarede ikke")
    return out["structured_output"]


def run_judge(courses):
    from concurrent.futures import ThreadPoolExecutor
    use_api = bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))
    judge = _judge_api if use_api else _judge_cli
    print(f"Dommer: {'Claude API' if use_api else 'claude -p (abonnement)'}", flush=True)
    jobs = []
    for c in courses:
        for u in c["units"]:
            payload = [{"index": i, "q": q["q"], "code": q.get("code", ""), "o": q["o"], "a": q["a"], "e": q["e"]}
                       for i, q in enumerate(u["questions"])]
            jobs.append((c, u, f"Fag: {c['full']} – enhed: {u['title']}\n\n" + json.dumps(payload, ensure_ascii=False)))

    def one(job):
        c, u, msg = job
        try:
            res = judge(msg)
        except Exception as exc:  # noqa: BLE001
            res = exc
        print(f"  dømt {c['id']}/{u['id']}", flush=True)
        return c, u, res

    judged, flagged = 0, []
    with ThreadPoolExecutor(4) as pool:
        for c, u, res in pool.map(one, jobs):
            if res is None or isinstance(res, Exception):
                flagged.append(f"{c['id']}/{u['id']}: dommeren kunne ikke vurdere enheden ({res or 'afvist'})")
                continue
            seen = set()
            for r in res["results"]:
                if not 0 <= r["index"] < len(u["questions"]):
                    continue
                seen.add(r["index"])
                judged += 1
                if not r["ok"]:
                    q = u["questions"][r["index"]]["q"][:70].replace("\n", " ")
                    flagged.append(f"{c['id']}/{u['id']}#{r['index']} «{q}…»: {r['problem']}")
            missing = set(range(len(u["questions"]))) - seen
            if missing:
                flagged.append(f"{c['id']}/{u['id']}: dommeren sprang spørgsmål {sorted(missing)} over")
    return judged, flagged


def load_concepts() -> tuple[list, list]:
    esc = "const esc = (s) => String(s);\n"
    js = esc + "\n".join((STATIC / f).read_text(encoding="utf-8") for f in ["charts.js", "explore-data.js", "explore-extra.js"])
    out = subprocess.run(["node"], input=js + "\nprocess.stdout.write(JSON.stringify({t: TOPICS, c: CONCEPTS}))",
                         capture_output=True, text=True, encoding="utf-8", check=True)
    d = json.loads(out.stdout)
    return d["t"], d["c"]


EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2728]")


def check_explore(_c, judge):
    """12. Udforsk: korrekte, korte idéer uden svar-afsløring – og ingen emojis i UI'et."""
    topics, concepts = load_concepts()
    tids = {t["id"] for t in topics}
    issues = []
    ids = [c["id"] for c in concepts]
    if len(ids) != len(set(ids)):
        issues.append("Dublet-id'er i CONCEPTS")
    longest = 0
    for c in concepts:
        w = f"udforsk/{c['id']}"
        if c["t"] not in tids:
            issues.append(f"{w}: ukendt emne {c['t']}")
        if c.get("type") == "order":
            if len(c.get("items", [])) < 3 or len(set(c["items"])) != len(c["items"]):
                issues.append(f"{w}: rækkefølge skal have mindst 3 forskellige punkter")
            c["o"] = [" → ".join(c["items"])]
        elif c.get("type") == "tf":
            if sorted(c["o"]) != ["Falsk", "Sandt"]:
                issues.append(f"{w}: sandt/falsk skal have præcis Sandt og Falsk")
        elif len(c["o"]) != 3 or len(set(c["o"])) != 3:
            issues.append(f"{w}: skal have 3 forskellige svar")
        if c.get("chart") and not c["chart"].get("series"):
            issues.append(f"{w}: graf uden data")
        if not (30 if c.get("type") == "tf" else 80) <= len(c["text"]) <= 420:
            issues.append(f"{w}: teksten er {len(c['text'])} tegn (skal være kort, 80-420)")
        lens = [len(o) for o in c["o"]]
        if not c.get("type") and lens[0] == max(lens) and lens.count(max(lens)) == 1:
            longest += 1
        for t in [c["title"], c["text"], c["q"], c["e"], *c["o"]]:
            if PLACEHOLDER.search(t):
                issues.append(f"{w}: pladsholdertekst")
    pct = longest / max(1, sum(not c.get("type") for c in concepts)) * 100
    if pct > 50:
        issues.append(f"Rigtigt svar er længst i {pct:.0f} % af idéerne")
    for f in ["index.html", "app.js", "explore.js", "explore-data.js", "explore-extra.js", "gamify.js", "charts.js"]:
        for n, line in enumerate((STATIC / f).read_text(encoding="utf-8").splitlines(), 1):
            if EMOJI.search(line):
                issues.append(f"Emoji i {f}:{n}")
    small = [t["name"] for t in topics if sum(c["t"] == t["id"] for c in concepts) < 4]
    if small:
        issues.append(f"For få idéer i: {', '.join(small)} (kræver ≥ 4)")
    note = f"{len(concepts)} idéer i {len(topics)} emner, rigtigt svar længst i {pct:.0f} %"
    if judge:
        pseudo = [{"id": "udforsk", "full": "Generel viden (Udforsk-feed: psykologi, business, økonomi, tænkning, videnskab, samfund, AI)",
                   "units": [{"id": t["id"], "title": t["name"], "questions": [
                       {"q": f"{c['title']}: {c['text']}\n" + (f"Graf-data: {json.dumps(c['chart'], ensure_ascii=False)}\n" if c.get("chart") else "")
                             + (f"Opgave: {c['q']} (rigtig rækkefølge er svar 0)" if c.get("type") == "order" else f"Spørgsmål: {c['q']}"),
                        "o": c["o"], "a": 0, "e": c["e"]}
                       for c in concepts if c["t"] == t["id"]]} for t in topics]}]
        judged, flagged = run_judge(pseudo)
        issues += flagged
        note += f", Claude vurderede {judged} idéer"
    return not issues, note, issues


LESSON_FILES = ["lessons.js", "lessons-doa.js", "lessons-sys.js"]


def load_lessons() -> dict:
    """Kører lessons.js i node med små stubbe og returnerer kortene med tegningerne som ren tekst."""
    stub = ("const esc = (s) => String(s); const store = {get: (k, d) => d, set() {}};\n"
            "function startLesson() {} function renderLearn() {} let course = 'doa'; const ic = () => '';\n")
    js = stub + (STATIC / "charts.js").read_text(encoding="utf-8") + "\n" + "\n".join(
        (STATIC / f).read_text(encoding="utf-8") for f in LESSON_FILES)
    js += ("\nconst strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/\\s+/g, ' ').trim();\n"
           "for (const k in LESSONS) for (const c of LESSONS[k]) {\n"
           "  if (c.visual) c.visualText = strip(LESSON_VIS[c.visual]());\n"
           "  if (c.vis) c.visualText = strip(LESSON_VIS[c.vis.type](c.vis));\n"
           "}\n"
           "process.stdout.write(JSON.stringify(LESSONS))")
    out = subprocess.run(["node"], input=js, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


def check_lessons(courses, judge):
    """13. Forklaring før quiz: korte kort, tjek-spørgsmål, ingen emojis, faktatjekket."""
    lessons = load_lessons()
    units = {f"{c['id']}/{u['id']}": u for c in courses for u in c["units"]}
    issues, n_cards = [], 0
    strip = lambda h: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()  # noqa: E731
    for key, cards in lessons.items():
        if key not in units:
            issues.append(f"{key}: ingen enhed med det id")
        kinds = [c["kind"] for c in cards]
        if kinds[0] == "check":
            issues.append(f"{key}: må ikke starte med et spørgsmål – forklaring først")
        if "check" not in kinds:
            issues.append(f"{key}: mangler tjek-spørgsmål")
        for i, c in enumerate(cards):
            n_cards += 1
            w = f"{key}#{i}"
            if c["kind"] == "check":
                if len(c["o"]) != 4 or len(set(c["o"])) != 4 or not 0 <= c["a"] < 4:
                    issues.append(f"{w}: tjek-spørgsmål skal have 4 forskellige svar og gyldigt a")
                texts = [c["q"], c["e"], *c["o"]]
            else:
                body = strip(c.get("body", ""))
                if len(body) > 600:
                    issues.append(f"{w}: forklaringen er {len(body)} tegn (max 600, hold den kort)")
                if c["kind"] == "steps" and not c.get("rows"):
                    issues.append(f"{w}: trin-kort uden trin")
                texts = [c.get("title", ""), body, c.get("outro", "")]
            for t in texts:
                if EMOJI.search(t) or PLACEHOLDER.search(t):
                    issues.append(f"{w}: emoji eller pladsholdertekst")
    for f in LESSON_FILES:
        if EMOJI.search((STATIC / f).read_text(encoding="utf-8")):
            issues.append(f"Emoji i {f}")
    missing = [k for k in units if k not in lessons]
    if missing:
        issues.append(f"Enheder uden forklaring: {', '.join(missing)}")
    note = f"{len(lessons)} enheder med forklaring, {n_cards} kort"
    if judge:
        pseudo = []
        for key, cards in lessons.items():
            cid, uid = key.split("/")
            course = next(c for c in courses if c["id"] == cid)
            qs = []
            for c in cards:
                if c["kind"] == "check":
                    qs.append({"q": c["q"], "code": c.get("code", ""), "o": c["o"], "a": c["a"], "e": c["e"]})
                else:
                    txt = f"FORKLARINGSKORT «{c['title']}»: {strip(c['body'])}"
                    if c.get("rows"):
                        txt += " Trin: " + "; ".join(f"{a}: {b}" for a, b in c["rows"]) + ". " + strip(c.get("outro", ""))
                    if c.get("vis"):
                        txt += f" Tegningsdata: {json.dumps(c['vis'], ensure_ascii=False)}"
                    elif c.get("visualText"):
                        txt += f" Tegningen viser: {c['visualText']}"
                    if c.get("chart"):
                        txt += f" Graf: {json.dumps(c['chart'], ensure_ascii=False)}"
                    qs.append({"q": txt + "\n(Vurder om forklaringen og tallene er korrekte. Svar 0 betyder 'forklaringen er korrekt'.)",
                               "code": c.get("code", ""), "o": ["Forklaringen er korrekt", "Forklaringen indeholder en fejl"],
                               "a": 0, "e": "Forklaringskort."})
            pseudo.append({"id": cid, "full": course["full"] + " (forklaringer før quiz)",
                           "units": [{"id": uid, "title": units[key]["title"], "questions": qs}]})
        judged, flagged = run_judge(pseudo)
        issues += flagged
        note += f", Claude vurderede {judged} kort"
    return not issues, note, issues


def check_exam_relevance(courses, _):
    """2. Hvert eksamensemne har en enhed med mindst 6 spørgsmål."""
    units = {(c["id"], u["id"]): len(u["questions"]) for c in courses for u in c["units"]}
    issues = []
    for cid, topics in (("doa", DOA_EXAM_TOPICS), ("sys", SYS_EXAM_TOPICS)):
        for name, uid in topics.items():
            n = units.get((cid, uid), 0)
            if n < 6:
                issues.append(f"{cid.upper()} – {name}: {n} spørgsmål (kræver ≥ 6)")
    total = len(DOA_EXAM_TOPICS) + len(SYS_EXAM_TOPICS)
    return not issues, f"{total - len(issues)}/{total} eksamensemner dækket", issues


def check_quality(courses, _):
    """3. Struktur og pladsholdertekst."""
    issues = []
    n = 0
    for c, u, i, q in all_questions(courses):
        n += 1
        where = f"{c['id']}/{u['id']}#{i}"
        if len(q.get("o", [])) != 4:
            issues.append(f"{where}: har {len(q.get('o', []))} svarmuligheder")
        if not isinstance(q.get("a"), int) or not 0 <= q["a"] < len(q.get("o", [])):
            issues.append(f"{where}: ugyldigt rigtigt svar")
        if len(set(q.get("o", []))) != len(q.get("o", [])):
            issues.append(f"{where}: dublet-svarmuligheder")
        if len(q.get("e", "")) < 20:
            issues.append(f"{where}: forklaring mangler/for kort")
        for t in [q.get("q", ""), q.get("e", "")] + q.get("o", []):
            if PLACEHOLDER.search(t):
                issues.append(f"{where}: pladsholdertekst «{t[:40]}»")
    return not issues, f"{n} spørgsmål tjekket", issues


def check_giveaway(courses, _):
    """4. Er det rigtige svar oftest det længste?"""
    total = longest = 0
    for _c, _u, _i, q in all_questions(courses):
        total += 1
        lens = [len(o) for o in q["o"]]
        if lens[q["a"]] == max(lens) and lens.count(max(lens)) == 1:
            longest += 1
    pct = longest / total * 100
    ok = pct <= 50
    issues = [] if pct <= 35 else [f"Rigtigt svar er det længste i {pct:.0f} % af spørgsmålene – gør de forkerte svar mere detaljerede"]
    return ok, f"rigtigt svar længst i {pct:.0f} % ({longest}/{total})", issues


def check_motivation(_c, _):
    """5. XP, streak, dagsmål, niveauer – og ingen lootboxes."""
    js = (STATIC / "app.js").read_text(encoding="utf-8")
    need = {"XP": r"\bxp\b", "streak": r"streak", "dagsmål": r"DAILY_GOAL", "niveau": r"level\(", "stjerner": r"stars"}
    issues = [f"Mangler {k}" for k, p in need.items() if not re.search(p, js, re.I)]
    if re.search(r"loot|kiste|chest|mystery ?box|gacha", js, re.I):
        issues.append("Fandt lootbox-lignende kode")
    if re.search(r"Math\.random\(\)[^;\n]*(xp|reward|bonus)", js, re.I):
        issues.append("Tilfældig belønning fundet")
    return not issues, "point, streak, dagsmål og niveauer – ingen lootboxes" if not issues else "", issues


def check_speed(_c, _):
    """6. Svartider."""
    issues, notes = [], []
    try:
        q = f"evaltest {int(time.time())} algorithms"  # ny søgning = kold cache
        _, t = get("/api/yt/search?q=" + q.replace(" ", "%20"))
        notes.append(f"YouTube {t:.1f} s")
        if t > 6:
            issues.append(f"YouTube-søgning tog {t:.1f} s (grænse 6 s)")
        _, t = get("/api/news?refresh=1")
        notes.append(f"nyheder {t:.1f} s")
        if t > 12:
            issues.append(f"Nyheder tog {t:.1f} s (grænse 12 s)")
    except Exception as exc:  # noqa: BLE001
        return False, "server kører ikke?", [f"Kunne ikke kontakte {BASE}: {exc}"]
    return not issues, ", ".join(notes), issues


def check_nudge(_c, _):
    """7. Mix-andel af læring + gameplay-filter på rigtige resultater."""
    js = (STATIC / "app.js").read_text(encoding="utf-8")
    m = re.search(r"const MIX = \[([^\]]+)\]", js)
    issues = []
    if not m:
        return False, "", ["MIX ikke fundet"]
    mix = re.findall(r'"(\w+)"', m.group(1))
    learn = mix.count("learn") / len(mix) * 100
    if learn < 45:
        issues.append(f"Kun {learn:.0f} % læring i mix")
    gp = re.compile(re.search(r"const NO_GAMEPLAY = /(.+)/i;", js).group(1), re.I)
    try:
        res, _ = get("/api/yt/search?q=minecraft%20gameplay")
        leaked = [v["title"] for v in res if not gp.search(v["title"])]
        note = f"{learn:.0f} % læring, gameplay-filter fanger {len(res) - len(leaked)}/{len(res)} på 'minecraft gameplay'"
        if len(leaked) > len(res) * 0.3:
            issues.append(f"Gameplay-filter lader {len(leaked)} igennem, fx «{leaked[0][:50]}»")
    except Exception as exc:  # noqa: BLE001
        note = f"{learn:.0f} % læring (server ikke tilgængelig: {exc})"
    return not issues, note, issues


def check_storage(_c, _):
    """8. Ingen download-kode, og Ryd alt findes."""
    py = (ROOT / "app.py").read_text(encoding="utf-8")
    issues = []
    if re.search(r"\.download\(|download=True|outtmpl", py):
        issues.append("app.py ser ud til at downloade medier")
    if "/api/storage/clear" not in py:
        issues.append("Mangler Ryd alt-endpoint")
    return not issues, "streamer alt, Ryd alt findes" if not issues else "", issues


def check_mobile(_c, _):
    """9. Mobil og kodevisning."""
    html = (STATIC / "index.html").read_text(encoding="utf-8")
    css = (STATIC / "style.css").read_text(encoding="utf-8")
    need = [("viewport-meta", 'name="viewport"' in html), ("bundnavigation", ".tabs" in css and "position: fixed" in css),
            ("monospace til kode", "--mono" in css), ("linjenumre", "counter(ln)" in css)]
    issues = [f"Mangler {n}" for n, ok in need if not ok]
    return not issues, "alle til stede" if not issues else "", issues


def check_news(_c, _):
    """10. Ingen markedsføring i top 5."""
    py = (ROOT / "app.py").read_text(encoding="utf-8")
    pat = re.search(r'MARKETING = re\.compile\(r"(.+?)"\s*\n\s*r"(.+?)", re\.I\)', py, re.S)
    try:
        news, _ = get("/api/news")
    except Exception as exc:  # noqa: BLE001
        return False, "server kører ikke?", [str(exc)]
    rx = re.compile(pat.group(1) + pat.group(2), re.I) if pat else None
    top = news[:5]
    bad = [n["title"] for n in top if rx and rx.search(n["title"])]
    return not bad, f"{len(news)} nyheder, top 5 uden markedsføring" if not bad else "", [f"Markedsføring i top 5: {t}" for t in bad]


def check_events(_c, _):
    """11. Events: fremtidige datoer, rigtigt format, virkende direkte links, abonnement (ingen API-nøgle)."""
    sys.path.insert(0, str(ROOT))
    import app as appmod
    py = (ROOT / "app.py").read_text(encoding="utf-8")
    issues = []
    if 'k != "ANTHROPIC_API_KEY"' not in py:
        issues.append("Event-søgningen fjerner ikke ANTHROPIC_API_KEY – kan bruge API-kredit i stedet for abonnement")
    try:
        data, _ = get("/api/events")
    except Exception as exc:  # noqa: BLE001
        return False, "server kører ikke?", [str(exc)]
    evs = data.get("events", [])
    today = dt.date.today().isoformat()
    for e in evs:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", e.get("date", "")) or e["date"] < today:
            issues.append(f"Forkert/gammel dato: {e.get('title')} ({e.get('date')})")
        if re.fullmatch(r"https?://[^/]+/?", e.get("url", "")):
            issues.append(f"Link er en forside, ikke eventet: {e.get('url')}")
        elif not appmod._link_ok(e.get("url", "")):
            issues.append(f"Dødt link: {e.get('title')} – {e.get('url')}")
    age_d = (time.time() - data.get("updated", 0)) / 86400
    if age_d > 4:
        issues.append(f"Events er {age_d:.0f} dage gamle")
    if not evs:
        issues.append("Ingen events fundet")
    return not issues, f"{len(evs)} events, alle links tjekket, opdateret for {age_d:.1f} d siden", issues


CHECKS = [
    ("1. Faktuel korrekthed", check_factual), ("2. Eksamensrelevans", check_exam_relevance),
    ("3. Spørgsmålskvalitet", check_quality), ("4. Ingen svar-afsløring", check_giveaway),
    ("5. Motivation uden lootboxes", check_motivation), ("6. Hastighed", check_speed),
    ("7. Produktivt nudge i YouTube", check_nudge), ("8. Lager", check_storage),
    ("9. Mobil og design", check_mobile), ("10. Nyheder er ikke kedelige", check_news),
    ("11. Events er ægte og aktuelle", check_events),
    ("12. Udforsk: fakta og design", check_explore),
    ("13. Forklaring før quiz", check_lessons),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--judge", action="store_true", help="Lad Claude faktatjekke alle spørgsmål")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    courses = load_courses()
    lines = [f"# Eval-rapport {dt.datetime.now():%Y-%m-%d %H:%M}", "", "| Kategori | Status | Note |", "|---|---|---|"]
    details, passed = [], 0
    for name, fn in CHECKS:
        try:
            ok, note, issues = fn(courses, args.judge)
        except Exception as exc:  # noqa: BLE001
            ok, note, issues = False, "tjek crashede", [repr(exc)]
        passed += ok
        status = "✅" if ok else ("⚠️" if not issues or ok else "❌")
        lines.append(f"| {name} | {status} | {note} |")
        print(f"{status} {name}: {note}")
        for i in issues:
            print(f"     - {i}")
        if issues:
            details += [f"### {name}"] + [f"- {i}" for i in issues] + [""]
    lines += ["", f"**{passed}/{len(CHECKS)} kategorier bestået**", ""] + (["## Fund", ""] + details if details else [])
    out = ROOT / "evals" / "reports" / f"{dt.date.today()}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n{passed}/{len(CHECKS)} bestået – rapport: {out}")
    sys.exit(0 if passed == len(CHECKS) else 1)


if __name__ == "__main__":
    main()
