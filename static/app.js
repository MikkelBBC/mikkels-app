/* Mikkels App – frontend. Ingen build-trin. */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ------------------------------------------------------------------ lagring
const store = {
  get(k, d) { try { const v = localStorage.getItem("ma:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("ma:" + k, JSON.stringify(v)); } catch { /* privat vindue */ } },
};

async function api(path, opts) {
  if (typeof STATIC_MODE !== "undefined" && STATIC_MODE) return staticApi(path, opts);
  const r = await fetch(path, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error || `Fejl ${r.status}`);
  return data;
}

document.querySelectorAll("[data-ic]").forEach((e) => { e.innerHTML = ic(e.dataset.ic); });
function paintThemeBtn() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("#btn-theme").innerHTML = ic(dark ? "sun" : "moon");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0b0c10" : "#f6f6fb";
}
paintThemeBtn();
$("#btn-theme").onclick = () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("ma:theme", JSON.stringify(t)); } catch { /* */ }
  paintThemeBtn();
};

// Lille, tilfredsstillende feedback: "+5" der flyver op + kort vibration på telefonen.
function celebrate(anchor, text) {
  try { navigator.vibrate?.(12); } catch { /* ikke understøttet */ }
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const f = document.createElement("div");
  f.className = "xp-float";
  f.textContent = text;
  f.style.left = (r.left + r.width / 2) + "px";
  f.style.top = (r.top + window.scrollY) + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}

const fmtDur = (s) => { if (!s) return ""; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const fmtViews = (n) => !n ? "" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + " mio. visninger" : n >= 1e3 ? Math.round(n / 1e3) + "k visninger" : n + " visninger";
const fmtAgo = (ts) => { const d = (Date.now() / 1000 - ts) / 3600; return d < 1 ? "lige nu" : d < 24 ? Math.round(d) + " t siden" : Math.round(d / 24) + " d siden"; };

// ------------------------------------------------------------------ point, streak, niveau
const DAILY_GOAL = 50;
const game = {
  xp: store.get("xp", 0),
  streak: store.get("streak", { count: 0, last: null }),
  daily: store.get("daily", { day: today(), xp: 0 }),
  level(xp = this.xp) { return Math.floor(Math.sqrt(xp / 40)) + 1; },
  levelStart(l) { return 40 * (l - 1) ** 2; },
  add(n) {
    const before = this.level();
    this.xp += n;
    if (this.daily.day !== today()) this.daily = { day: today(), xp: 0 };
    this.daily.xp += n;
    const t = today();
    if (this.streak.last !== t) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      this.streak = { count: this.streak.last === y ? this.streak.count + 1 : 1, last: t };
    }
    store.set("xp", this.xp); store.set("streak", this.streak); store.set("daily", this.daily);
    renderPills();
    if (this.level() > before) toast(`Niveau ${this.level()} nået`);
  },
  streakAlive() {
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    return this.streak.last === today() || this.streak.last === y ? this.streak.count : 0;
  },
};

function renderPills() {
  $("#pill-streak").innerHTML = ic("flame") + game.streakAlive();
  $("#pill-xp").innerHTML = `${ic("star")}${game.xp}<span class="lv">Niv. ${game.level()}</span>`;
}

// ------------------------------------------------------------------ faner
const TITLES = { learn: "Lær", yt: "YouTube", pod: "Podcasts", ai: "AI" };
let currentTab = "learn";
function showTab(name) {
  currentTab = name;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab").forEach((s) => s.classList.toggle("active", s.id === "tab-" + name));
  $("#title").textContent = TITLES[name];
  store.set("tab", name);
  window.scrollTo(0, 0);
  if (name === "learn" && typeof lesson !== "undefined" && !lesson) renderLearn();
  if (name === "yt") ytEnsureFeed();
  if (name === "ai") newsEnsure();
  if (name === "pod") podRenderSubs();
}
document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

// ================================================================== LÆR (quiz-sti)
const progress = store.get("progress", {});      // { "doa/bigo": { stars: 2, best: 0.8 } }
let mistakes = store.get("mistakes", []);       // [ "doa/bigo/3", ... ]
let course = store.get("course", "doa");

function unitKey(c, u) { return c + "/" + u; }
function unitStars(c, u) { return (progress[unitKey(c, u)] || {}).stars || 0; }

function highlight(code) {
  const KW = /\b(int|bool|void|char|auto|const|return|if|else|for|while|do|struct|class|public|private|new|delete|nullptr|true|false|size_t|template|typename|using|namespace|mutable|static|unsigned|long|double|float|break|continue|include|PRIVATE|VERSION)\b/;
  const TY = /\b(std|vector|string|cout|printf|variant|unique_ptr|shared_ptr|make_shared|make_unique|mutex|thread|Node|fork|fcntl|cmake_minimum_required|project|add_executable)\b/;
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])')|\b(\d+)\b|\b([A-Za-z_]\w*)\b/g;
  return code.split("\n").map((line) => {
    let out = "", last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      out += esc(line.slice(last, m.index));
      const [tok, com, str, num, word] = m;
      if (com) out += `<span class="com">${esc(com)}</span>`;
      else if (str) out += `<span class="str">${esc(str)}</span>`;
      else if (num) out += `<span class="num">${num}</span>`;
      else if (KW.test(word)) out += `<span class="kw">${word}</span>`;
      else if (TY.test(word)) out += `<span class="ty">${word}</span>`;
      else if (line[re.lastIndex] === "(") out += `<span class="fn">${word}</span>`;
      else out += esc(tok);
      last = re.lastIndex;
    }
    out += esc(line.slice(last));
    return `<span class="l">${out || " "}</span>`;
  }).join("");
}
const inline = (t) => esc(t).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");

function courseSeg(active) {
  return `<div class="seg course-seg">${COURSES.map((x) => `<button data-c="${x.id}" class="${x.id === active ? "on" : ""}">${ic(x.icon)}${esc(x.name)}</button>`).join("")}
    <button data-c="explore" class="${active === "explore" ? "on" : ""}">${ic("compass")}Udforsk</button></div>`;
}
function bindCourseSeg(el) {
  el.querySelectorAll(".course-seg button").forEach((b) => b.onclick = () => { course = b.dataset.c; store.set("course", course); renderLearn(); });
}

function renderLearn() {
  const el = $("#learn");
  if (course === "explore" && typeof renderExplore === "function") return renderExplore(el);
  const c = COURSES.find((x) => x.id === course) || COURSES[0];
  const daily = game.daily.day === today() ? game.daily.xp : 0;
  const pct = Math.min(100, Math.round(daily / DAILY_GOAL * 100));
  const lvl = game.level(), lvlFrom = game.levelStart(lvl), lvlTo = game.levelStart(lvl + 1);
  const doneUnits = c.units.filter((u) => unitStars(c.id, u.id) > 0).length;
  const nextIdx = c.units.findIndex((u) => unitStars(c.id, u.id) === 0);
  const myMistakes = mistakes.filter((k) => k.startsWith(c.id + "/"));

  el.innerHTML = `
    ${courseSeg(c.id)}
    ${typeof petCard === "function" ? petCard() : ""}
    <div class="goal-card">
      <div class="goal-ring" style="--p:${pct}"><span>${daily}<small>/${DAILY_GOAL}</small></span></div>
      <div class="goal-txt">
        <b>${pct >= 100 ? "Dagens mål nået" : "Dagens mål"}</b>
        <span class="muted">${pct >= 100 ? "Alt herfra er bonus." : `${DAILY_GOAL - daily} XP tilbage i dag`}</span>
        <div class="bar"><i style="width:${Math.round((game.xp - lvlFrom) / (lvlTo - lvlFrom) * 100)}%"></i></div>
        <span class="muted">Niveau ${lvl} → ${lvl + 1}: ${game.xp - lvlFrom}/${lvlTo - lvlFrom} XP</span>
      </div>
    </div>
    ${(() => { const e = nextStarredEvent(); return e ? `<button class="ev-reminder" id="ev-rem"><span class="ev-ico">${ic("calendar")}</span><div><b>${esc(e.title)}</b>
      <span class="muted">${whenTxt(daysUntil(e))} · ${esc(e.city)}${e.time ? " · " + esc(e.time) : ""}</span></div><span class="muted">${ic("chevron")}</span></button>` : ""; })()}
    <div class="course-head">
      <div><h2>${esc(c.full)}</h2><span class="muted">${doneUnits} af ${c.units.length} enheder gennemført</span></div>
      ${myMistakes.length ? `<button class="btn ghost" id="btn-review">${ic("refresh")} Repetér fejl (${myMistakes.length})</button>` : ""}
    </div>
    <div class="path">
      ${c.units.map((u, i) => {
        const s = unitStars(c.id, u.id);
        const state = s > 0 ? "done" : i === nextIdx ? "next" : i < nextIdx || nextIdx === -1 ? "done" : "locked";
        const offset = [0, 1, 2, 1, 0, -1, -2, -1][i % 8];
        return `<div class="node-wrap" style="--off:${offset}">
          <button class="node ${state}" data-u="${u.id}" aria-label="${esc(u.title)}">
            <span class="node-ico">${s > 0 ? ic("check") : state === "next" ? ic("play") : i + 1}</span>
          </button>
          <div class="node-label"><b>${esc(u.title)}</b><span>${esc(u.sub)} · ${u.questions.length} spm.</span>
            <span class="stars">${[1, 2, 3].map((n) => `<i class="${n <= s ? "on" : ""}">${ic("star")}</i>`).join("")}</span></div>
          ${state === "next" ? `<div class="start-bubble">START</div>` : ""}
        </div>`;
      }).join("")}
    </div>`;

  bindCourseSeg(el);
  el.querySelectorAll(".node").forEach((b) => b.onclick = () => startLesson(c, c.units.find((u) => u.id === b.dataset.u)));
  const rem = $("#ev-rem", el);
  if (rem) rem.onclick = () => { showTab("ai"); showAiView("events"); };
  const rv = $("#btn-review", el);
  if (rv) rv.onclick = () => startReview(c);
}

let lesson = null;
function startLesson(c, u) {
  const qs = shuffle(u.questions.map((q, i) => ({ ...q, key: `${c.id}/${u.id}/${i}`, topic: u.title })));
  lesson = { c, u, qs, i: 0, correct: 0, combo: 0, xp: 0, review: false };
  renderQuestion();
}
function startReview(c) {
  const qs = mistakes.filter((k) => k.startsWith(c.id + "/")).slice(0, 10).map((k) => {
    const [, uid, qi] = k.split("/");
    const u = c.units.find((x) => x.id === uid);
    return u && u.questions[qi] ? { ...u.questions[qi], key: k, topic: u.title } : null;
  }).filter(Boolean);
  if (!qs.length) { mistakes = mistakes.filter((k) => !k.startsWith(c.id + "/")); store.set("mistakes", mistakes); return renderLearn(); }
  lesson = { c, u: { title: "Repetér fejl" }, qs: shuffle(qs), i: 0, correct: 0, combo: 0, xp: 0, review: true };
  renderQuestion();
}

function renderQuestion() {
  const L = lesson, q = L.qs[L.i];
  const order = shuffle(q.o.map((t, i) => ({ t, i })));
  const el = $("#learn");
  el.innerHTML = `
    <div class="lesson-top">
      <button class="icon" id="q-quit" title="Afslut">${ic("x")}</button>
      <div class="bar big"><i style="width:${L.i / L.qs.length * 100}%"></i></div>
      <span class="combo ${L.combo >= 3 ? "hot" : ""}">${L.combo >= 2 ? ic("flame") + "×" + L.combo : ""}</span>
    </div>
    <div class="qcard">
      <div class="topic">${esc(L.c.name)} · ${esc(q.topic)}</div>
      <h2>${inline(q.q)}</h2>
      ${q.code ? `<pre class="code">${highlight(q.code)}</pre>` : ""}
      ${q.chart ? `<div class="chart-wrap">${chartSvg(q.chart)}</div>` : ""}
      <div id="opts">${order.map((o, k) => `<button class="opt" data-i="${o.i}"><span class="k">${"ABCD"[k]}</span><span>${inline(o.t)}</span></button>`).join("")}</div>
      <div id="q-feedback"></div>
    </div>`;
  $("#q-quit").onclick = () => { lesson = null; renderLearn(); };
  el.querySelectorAll(".opt").forEach((b) => b.onclick = () => answer(+b.dataset.i, b));
  window.scrollTo(0, 0);
}

function answer(i, btn) {
  const L = lesson, q = L.qs[L.i], ok = i === q.a;
  document.querySelectorAll(".opt").forEach((b) => { b.disabled = true; if (+b.dataset.i === q.a) b.classList.add("right"); });
  let gained = 0;
  if (ok) {
    L.correct++; L.combo++;
    typeof track === "function" && track("correct", { combo: L.combo });
    gained = 10 + (L.combo >= 3 ? 5 : 0);
    if (L.review) mistakes = mistakes.filter((k) => k !== q.key);
  } else {
    btn.classList.add("wrong"); L.combo = 0;
    if (!mistakes.includes(q.key)) mistakes.push(q.key);
  }
  store.set("mistakes", mistakes);
  L.xp += gained;
  if (gained) { game.add(gained); celebrate(btn, "+" + gained); }
  const last = L.i === L.qs.length - 1;
  $("#q-feedback").innerHTML = `
    <div class="explain ${ok ? "" : "bad"}"><b>${ok ? `Rigtigt! +${gained} XP${L.combo >= 3 ? " (combo)" : ""}` : "Ikke helt."}</b><br>${inline(q.e)}</div>
    <div class="q-next"><button class="btn" id="q-next">${last ? "Se resultat" : "Næste " + ic("right")}</button></div>`;
  $("#q-next").onclick = () => { if (last) finishLesson(); else { L.i++; renderQuestion(); } };
  $("#q-next").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function finishLesson() {
  const L = lesson, acc = L.correct / L.qs.length;
  const stars = acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : acc >= 0.6 ? 1 : 0;
  let bonus = 0;
  if (!L.review) {
    const k = unitKey(L.c.id, L.u.id), prev = progress[k] || { stars: 0, best: 0 };
    if (stars === 3 && prev.stars < 3) bonus += 20;
    if (stars > 0 && prev.stars === 0) bonus += 15;
    progress[k] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, acc) };
    store.set("progress", progress);
  } else if (acc === 1) bonus = 10;
  if (bonus) game.add(bonus);
  typeof track === "function" && track(L.review ? "review" : "lesson", { stars });
  $("#learn").innerHTML = `
    <div class="result">
      <div class="big-stars">${[1, 2, 3].map((n) => `<i class="${n <= stars ? "on" : ""}">${ic("star")}</i>`).join("")}</div>
      <h2>${stars === 3 ? "Perfekt!" : stars >= 1 ? "Bestået" : L.review ? "Godt repeteret" : "Næsten – prøv igen"}</h2>
      <div class="result-grid">
        <div><b>${L.correct}/${L.qs.length}</b><span>rigtige</span></div>
        <div><b>+${L.xp + bonus}</b><span>XP</span></div>
        <div><b>${ic("flame")}${game.streakAlive()}</b><span>dage i træk</span></div>
      </div>
      ${bonus ? `<p class="muted">Inkl. ${bonus} bonus-XP${stars === 3 ? " for 3 stjerner" : ""}.</p>` : ""}
      ${!L.review && stars === 0 ? `<p class="muted">Du skal have 60 % for at låse næste enhed op. Forkerte svar ligger i "Repetér fejl".</p>` : ""}
      <div class="q-next center">
        ${stars < 3 && !L.review ? `<button class="btn ghost" id="r-again">Prøv igen</button>` : ""}
        <button class="btn" id="r-done">Fortsæt</button>
      </div>
    </div>`;
  $("#r-done").onclick = () => { lesson = null; renderLearn(); };
  const again = $("#r-again");
  if (again) again.onclick = () => startLesson(L.c, L.u);
}

// ================================================================== YOUTUBE (uendelig feed)
// Søgninger pr. stemning. Feedet blander dem, så man bliver skubbet mod noget der giver noget.
const MOODS = {
  learn: { label: "Lær", icon: "cap", tag: "AI & tech", qs: ["AI news this week", "Claude AI new features", "AI agents explained", "Two Minute Papers", "AI Explained latest",
    "how large language models work", "Fireship", "Andrej Karpathy", "Machine Learning Street Talk", "3Blue1Brown", "computer science explained visually",
    "Linux kernel explained", "how computers work", "algorithms visualized", "Veritasium", "engineering student study tips", "AI coding tools 2026", "Dwarkesh Podcast clips"] },
  curious: { label: "Interessant", icon: "chart", tag: "Interessant", qs: ["screen time kids study", "iPad kids generation", "statistics documentary", "Kurzgesagt", "Johnny Harris", "Wendover Productions",
    "Real Engineering", "RealLifeLore", "PolyMatter", "Vox explained", "data visualization stories", "Our World in Data", "social media brain research",
    "Huberman dopamine", "DR dokumentar", "economics explained", "Big Think"] },
  chill: { label: "Slå fra", icon: "coffee", tag: "Slap af", qs: ["Mark Rober", "Tom Scott", "Casually Explained", "stand up comedy", "dansk stand up", "satisfying engineering", "Primitive Technology",
    "Answer in Progress", "Joel Haver", "Drew Gooden", "Jaiden Animations", "ElectroBOOM", "Not Just Bikes", "nature documentary 4k", "Simone Giertz"] },
};
const MIX = ["learn", "curious", "learn", "chill", "learn", "curious"];   // ca. 50 % lær, 33 % interessant, 17 % slap af
const NO_GAMEPLAY = /\b(gameplay|let'?s play|walkthrough|playthrough|speedrun|fortnite|minecraft|roblox|gta|#shorts)\b/i;

let ytMood = store.get("ytMood", "mix");
let ytHistory = store.get("ytHistory", []);  // [{id,title,channel,mood}]
const yt = { seen: new Set(), queue: [], loading: false, started: false, step: 0 };

function ytPlan() {
  // Næste søgning: følg stemningen, og bland "mere fra kanaler du har set" ind
  yt.step++;
  const recentCh = [...new Set(ytHistory.slice(-15).map((h) => h.channel).filter(Boolean))];
  if (recentCh.length && yt.step % 4 === 0) {
    const ch = recentCh[Math.floor(Math.random() * recentCh.length)];
    return { q: ch, mood: "for-you", tag: "Fordi du så " + ch };
  }
  const mood = ytMood === "mix" ? MIX[yt.step % MIX.length] : ytMood;
  const list = MOODS[mood].qs;
  if (!yt.queue.length || yt.queueMood !== ytMood) { yt.queue = shuffle(list.map((q) => ({ q, mood }))); yt.queueMood = ytMood; }
  // i mix-tilstand: tag fra den rigtige stemning
  if (ytMood === "mix") { const pool = shuffle(MOODS[mood].qs); return { q: pool[0], mood, tag: MOODS[mood].tag }; }
  const n = yt.queue.shift();
  return { ...n, tag: MOODS[mood].tag };
}

function ytRenderMoods() {
  const el = $("#yt-moods");
  const all = [["mix", ic("shuffle") + "Mix"], ...Object.entries(MOODS).map(([k, v]) => [k, ic(v.icon) + v.label])];
  el.innerHTML = all.map(([k, l]) => `<button class="chip ${k === ytMood ? "on" : ""}" data-m="${k}">${l}</button>`).join("");
  el.querySelectorAll(".chip").forEach((b) => b.onclick = () => { ytMood = b.dataset.m; store.set("ytMood", ytMood); ytReset(); });
}

function ytReset() {
  yt.seen.clear(); yt.queue = []; yt.step = 0;
  $("#yt-results").innerHTML = "";
  ytRenderMoods();
  ytLoadMore();
}

function ytCard(v, tag) {
  return `<button class="vid" data-id="${esc(v.id)}" data-title="${esc(v.title)}" data-ch="${esc(v.channel)}" data-tag="${esc(tag || "")}">
    <div class="thumb"><img loading="lazy" src="${esc(v.thumb)}" alt="">${v.duration ? `<span class="dur">${fmtDur(v.duration)}</span>` : ""}</div>
    <h3>${esc(v.title)}</h3><p>${esc(v.channel)}${v.views ? " · " + fmtViews(v.views) : ""}</p>
    ${tag ? `<span class="vtag">${esc(tag)}</span>` : ""}</button>`;
}

function ytAppend(list, tag) {
  const fresh = list.filter((v) => !yt.seen.has(v.id) && !NO_GAMEPLAY.test(v.title) && (v.duration === 0 || v.duration >= 90));
  fresh.forEach((v) => yt.seen.add(v.id));
  $("#yt-results").insertAdjacentHTML("beforeend", fresh.map((v) => ytCard(v, tag)).join(""));
  return fresh.length;
}

async function ytLoadMore(depth = 0) {
  if (yt.loading || depth > 3) return;
  yt.loading = true;
  $("#yt-sentinel").textContent = "Henter forslag…";
  const plans = [ytPlan(), ytPlan()];
  const results = await Promise.allSettled(plans.map((p) => api("/api/yt/search?q=" + encodeURIComponent(p.q))));
  // flet de to søgninger, så feedet veksler
  const lists = results.map((r, i) => r.status === "fulfilled" ? shuffle(r.value).slice(0, 8).map((v) => [v, plans[i].tag]) : []);
  let added = 0;
  for (let k = 0; k < 8; k++) for (const l of lists) if (l[k]) added += ytAppend([l[k][0]], l[k][1]);
  yt.loading = false;
  const failed = results.every((r) => r.status === "rejected");
  $("#yt-sentinel").textContent = failed ? "Kunne ikke hente – rul igen for at prøve igen" : "Rul for flere";
  if (!failed && added < 4) ytLoadMore(depth + 1);   // hvis alt var set/filtreret, hent mere
}

function ytEnsureFeed() {
  if (yt.started) return;
  yt.started = true;
  ytRenderMoods();
  ytLoadMore();
}

new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && currentTab === "yt" && yt.started && !yt.searchMode) ytLoadMore();
}, { rootMargin: "800px" }).observe($("#yt-sentinel"));

function ytPlay(id, title, channel, tag) {
  const p = $("#yt-player");
  p.classList.remove("hidden");
  p.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
    <div class="pbar"><span>${esc(title)}</span>
      <a href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener">Åbn i YouTube</a>
      <button id="yt-close">Luk</button></div>`;
  $("#yt-close").onclick = () => { p.classList.add("hidden"); p.innerHTML = ""; };
  ytHistory.push({ id, title, channel, tag, t: Date.now() });
  ytHistory = ytHistory.slice(-60);
  store.set("ytHistory", ytHistory);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#yt-results").addEventListener("click", (e) => {
  const b = e.target.closest(".vid");
  if (b) ytPlay(b.dataset.id, b.dataset.title, b.dataset.ch, b.dataset.tag);
});

$("#yt-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("#yt-q").value.trim();
  if (!q) { yt.searchMode = false; return ytReset(); }
  yt.searchMode = true;
  yt.started = true;
  $("#yt-results").innerHTML = "";
  $("#yt-sentinel").textContent = "Søger…";
  try {
    const list = await api("/api/yt/search?q=" + encodeURIComponent(q));
    yt.seen.clear();
    list.forEach((v) => yt.seen.add(v.id));
    $("#yt-results").innerHTML = list.map((v) => ytCard(v, "")).join("") || `<div class="empty">Ingen resultater</div>`;
    if (list.length === 1 && /youtu/.test(q)) ytPlay(list[0].id, list[0].title, "", "");
    $("#yt-sentinel").innerHTML = `<button class="btn ghost" id="yt-back">${ic("left")}Tilbage til forslag</button>`;
    $("#yt-back").onclick = () => { $("#yt-q").value = ""; yt.searchMode = false; ytReset(); };
  } catch (err) { $("#yt-sentinel").innerHTML = `<div class="err">${esc(err.message)}</div>`; }
});

// ================================================================== PODCASTS (streaming)
let podSubs = store.get("podSubs", []);   // [{title,author,feed,art}]
let podPos = store.get("podPos", {});     // { audioUrl: sekunder }

function podRenderSubs() {
  $("#pod-subs-h").classList.toggle("hidden", !podSubs.length);
  $("#pod-subs").innerHTML = podSubs.map((p, i) => `<button class="podtile" data-i="${i}"><img src="${esc(p.art)}" alt=""><span>${esc(p.title)}</span></button>`).join("");
  $("#pod-subs").querySelectorAll(".podtile").forEach((b) => b.onclick = () => podOpen(podSubs[+b.dataset.i]));
  if (!podSubs.length && !$("#pod-list").innerHTML) {
    $("#pod-list").innerHTML = `<div class="empty">Søg efter en podcast og tryk Gem for at gemme den her.<br>Forslag: ${["Lex Fridman", "Hard Fork", "Latent Space", "Huberman Lab", "Det Vi Taler Om"].map((s) => `<button class="chip pod-sug">${s}</button>`).join(" ")}</div>`;
    document.querySelectorAll(".pod-sug").forEach((b) => b.onclick = () => { $("#pod-q").value = b.textContent; $("#pod-form").requestSubmit(); });
  }
}

$("#pod-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("#pod-q").value.trim();
  if (!q) return;
  const el = $("#pod-list");
  el.innerHTML = `<div class="loading">Søger…</div>`;
  try {
    const list = await api("/api/pod/search?q=" + encodeURIComponent(q));
    el.innerHTML = list.map((p, i) => `<button class="podrow" data-i="${i}"><img src="${esc(p.art)}" alt=""><div><b>${esc(p.title)}</b><span class="muted">${esc(p.author)}</span></div></button>`).join("") || `<div class="empty">Ingen podcasts fundet</div>`;
    el.querySelectorAll(".podrow").forEach((b) => b.onclick = () => podOpen(list[+b.dataset.i]));
  } catch (err) { el.innerHTML = `<div class="err">${esc(err.message)}</div>`; }
});

async function podOpen(p) {
  const el = $("#pod-list");
  const subbed = () => podSubs.some((s) => s.feed === p.feed);
  el.innerHTML = `<div class="loading">Henter episoder…</div>`;
  window.scrollTo(0, 0);
  try {
    const d = await api("/api/pod/episodes?" + new URLSearchParams({ feed: p.feed, id: p.id || "", title: p.title || "" }));
    el.innerHTML = `<div class="pod-head"><img src="${esc(p.art)}" alt=""><div><h2>${esc(p.title)}</h2>
        <button class="btn ghost" id="pod-sub">${ic("bookmark")}${subbed() ? "Gemt" : "Gem"}</button></div></div>
      ${d.episodes.map((ep, i) => `<div class="ep" data-i="${i}"><button class="play">▶</button><div><b>${esc(ep.title)}</b>
        <p>${ep.date ? new Date(ep.date * 1000).toLocaleDateString("da-DK") : ""}${ep.duration ? " · " + fmtDur(ep.duration) : ""}${podPos[ep.audio] ? " · fortsæt" : ""}</p>
        <p>${esc(ep.summary)}</p></div></div>`).join("")}`;
    $("#pod-sub").onclick = (e) => {
      podSubs = subbed() ? podSubs.filter((s) => s.feed !== p.feed) : [...podSubs, p];
      store.set("podSubs", podSubs);
      e.currentTarget.innerHTML = ic("bookmark") + (subbed() ? "Gemt" : "Gem"); e.currentTarget.classList.toggle("on", subbed());
      podRenderSubs();
    };
    el.querySelectorAll(".ep .play").forEach((b) => b.onclick = () => {
      const ep = d.episodes[+b.closest(".ep").dataset.i];
      document.querySelectorAll(".ep").forEach((x) => x.classList.remove("playing"));
      b.closest(".ep").classList.add("playing");
      podPlay(ep, p.title);
    });
  } catch (err) { el.innerHTML = `<div class="err">${esc(err.message)}</div>`; }
}

function podPlay(ep, show) {
  const a = $("#audio");
  $("#audio-bar").classList.remove("hidden");
  $("#audio-title").textContent = show + " – " + ep.title;
  a.src = ep.audio;
  a.dataset.key = ep.audio;
  a.onloadedmetadata = () => { if (podPos[ep.audio]) a.currentTime = podPos[ep.audio]; };
  a.play().catch(() => {});
}
$("#audio").addEventListener("timeupdate", (e) => {
  const a = e.target;
  if (!a.dataset.key || Math.floor(a.currentTime) % 5) return;
  podPos[a.dataset.key] = a.currentTime;
  store.set("podPos", podPos);
});

// ================================================================== AI-NYT
let news = null;
async function newsEnsure(refresh) {
  if (news && !refresh) return;
  $("#news-list").innerHTML = `<div class="loading">Henter nyheder…</div>`;
  try { news = await api("/api/news" + (refresh ? "?refresh=1" : "")); renderNews(); }
  catch (err) { $("#news-list").innerHTML = `<div class="err">${esc(err.message)}</div>`; }
}
// Det, der er relevant for dig, rykker op: AI-værktøjer du kan bruge, Claude/agenter, uddannelse/job og Danmark/EU.
const NEWS_BOOST = /\b(claude|anthropic|agent|agents|coding|code|cursor|codex|open[- ]source|free|gratis|student|education|university|job|jobs|eu|europe|denmark|danmark|dansk)\b/i;
let newsMode = store.get("newsMode", "top"), newsAll = false;
function newsRank(list) {
  // Listen kommer sorteret efter vigtighed fra serveren. Plads → point, plus bonus for relevante emner.
  return list.map((n, i) => ({ n, r: (list.length - i) / list.length + (NEWS_BOOST.test(n.title) ? 0.35 : 0) + (n.cat === "Prøv selv" ? 0.15 : 0) }))
    .sort((a, b) => b.r - a.r).map((x) => x.n);
}
function renderNews() {
  const cats = [["top", "Vigtigst"], ["Prøv selv", "Prøv selv"], ["Modeller", "Modeller"], ["Forskning", "Forskning"], ["Samfund", "Samfund"]];
  $("#news-filter").innerHTML = cats.map(([k, l]) => `<button class="chip ${k === newsMode ? "on" : ""}" data-c="${k}">${k === "top" ? ic("zap") : ""}${l}</button>`).join("") +
    `<button class="chip" id="news-refresh" aria-label="Opdater">${ic("refresh")}</button>`;
  $("#news-filter").querySelectorAll("[data-c]").forEach((b) => b.onclick = () => { newsMode = b.dataset.c; newsAll = false; store.set("newsMode", newsMode); renderNews(); });
  $("#news-refresh").onclick = () => newsEnsure(true);
  const list = newsMode === "top" ? newsRank(news) : news.filter((n) => n.cat === newsMode);
  const LIMIT = newsMode === "top" ? 8 : 12;
  const shown = newsAll ? list : list.slice(0, LIMIT);
  const item = (n, i) => `<a class="news ${newsMode === "top" && i < 3 ? "big" : ""}" href="${esc(n.link)}" target="_blank" rel="noopener">
      <div class="meta">${newsMode === "top" ? `<span class="rank">${i + 1}</span>` : ""}<span class="tag" data-c="${esc(n.cat)}">${esc(n.cat)}</span>${esc(n.source)} · ${fmtAgo(n.date)}</div>
      <h3>${esc(n.title)}</h3>${n.summary && (newsMode !== "top" || i < 3) ? `<p>${esc(n.summary)}</p>` : ""}</a>`;
  $("#news-list").innerHTML = (newsMode === "top" ? `<p class="muted">De ${LIMIT} vigtigste historier lige nu – markedsføring og kundehistorier er sorteret fra.</p>` : "") +
    (shown.map(item).join("") || `<div class="empty">Ingen nyheder i denne kategori</div>`) +
    (!newsAll && list.length > LIMIT ? `<div class="center pad"><button class="btn ghost" id="news-more">Vis ${list.length - LIMIT} mere</button></div>` : "");
  const more = $("#news-more");
  if (more) more.onclick = () => { newsAll = true; renderNews(); };
}

// ================================================================== AI-VÆRKTØJER
// Kort guide: opgave → værktøj. Priser ændrer sig ofte, så de er bevidst angivet groft.
const AI_TOOLS = [
  { task: "Kode og projekter", icon: "code", pick: "Claude Code", why: "Arbejder direkte i dine filer, kører tests og laver commits. Det du bruger nu.",
    alts: ["Codex (OpenAI) – lignende agent", "Cursor – editor med AI indbygget", "GitHub Copilot – autocomplete i VS Code"] },
  { task: "Eksamenslæsning fra egne PDF'er", icon: "book", pick: "NotebookLM", why: "Svarer kun ud fra dine kilder og viser citater. Kan lave lyd-oversigter du kan høre på cyklen.",
    alts: ["Claude-projekt med kursusfilerne", "ChatGPT med filupload"] },
  { task: "Tænke, skrive og forklare", icon: "message", pick: "Claude", why: "Stærk til lange tekster, forklaringer og dansk. Brug projekter til at holde kontekst pr. fag.",
    alts: ["ChatGPT – bredest økosystem og stemmetilstand", "Gemini – god hvis du lever i Google-pakken"] },
  { task: "Research med kilder", icon: "search", pick: "Perplexity / Deep Research", why: "Søger nettet og viser kilder ved hvert udsagn. Brug Deep Research-tilstande til større spørgsmål.",
    alts: ["Claude med web search", "ChatGPT deep research", "Gemini Deep Research"] },
  { task: "Tale til tekst", icon: "mic", pick: "Wispr Flow", why: "Dikter i alle apps – hurtigere end at skrive. Godt til noter og prompts.",
    alts: ["Whisper (gratis, lokalt)", "Indbygget diktering på telefonen"] },
  { task: "Billeder og design", icon: "image", pick: "Midjourney / GPT-billeder", why: "Midjourney til flotte stemningsbilleder, ChatGPT/Gemini til billeder med tekst og hurtige redigeringer.",
    alts: ["Ideogram – god til tekst i billeder", "Canva AI – til opslag og præsentationer"] },
  { task: "Automatisering", icon: "workflow", pick: "n8n eller Zapier", why: "Kæd apps sammen (mail → note → besked). Med MCP kan Claude også styre værktøjerne direkte.",
    alts: ["Make", "Egne scripts med Claude API"] },
  { task: "Second brain / noter", icon: "notes", pick: "Obsidian + Claude", why: "Lokale markdown-filer som AI kan læse og skrive i. Det er sådan din boks er sat op.",
    alts: ["Notion AI", "Mem"] },
];
const AI_RULES = [
  ["Start gratis", "Prøv gratis-niveauet en uge, før du betaler. Betal kun for det værktøj du faktisk åbner hver dag."],
  ["Én hovedassistent", "Vælg én chat-AI som hovedværktøj og lær den godt, i stedet for fem halvt."],
  ["Tjek fakta", "Bed om kilder ved alt der skal i en rapport eller til eksamen."],
  ["Lille vs. stor model", "Hurtig model til simple ting, reasoning-model til svær kode og matematik."],
];
function renderTools() {
  $("#ai-tools").innerHTML = `
    <p class="muted">Hvad skal du lave? Tryk på en opgave for at se alternativer.</p>
    <div class="tools">${AI_TOOLS.map((t, i) => `<details class="tool"><summary><span class="t-ico">${ic(t.icon)}</span><div><span class="muted">${esc(t.task)}</span><b>${esc(t.pick)}</b></div></summary>
      <p>${esc(t.why)}</p><ul>${t.alts.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></details>`).join("")}</div>
    <h2 class="sub">Tommelfingerregler</h2>
    <div class="rules">${AI_RULES.map(([h, t]) => `<div class="rule"><b>${esc(h)}</b><p>${esc(t)}</p></div>`).join("")}</div>
    <div class="cta"><b>Test din viden</b><p class="muted">Der er en AI-quiz under Lær → AI.</p>
      <button class="btn" id="tools-quiz">Tag AI-quizzen</button></div>`;
  $("#tools-quiz").onclick = () => { course = "ai"; store.set("course", course); showTab("learn"); renderLearn(); };
}
function showAiView(v) {
  document.querySelectorAll("#ai-seg button").forEach((x) => x.classList.toggle("on", x.dataset.v === v));
  document.querySelectorAll(".ai-view").forEach((el) => el.classList.toggle("hidden", el.id !== "ai-" + v));
  if (v === "tools") renderTools();
  if (v === "events") eventsLoad();
}
document.querySelectorAll("#ai-seg button").forEach((b) => b.onclick = () => showAiView(b.dataset.v));

// ================================================================== AI-EVENTS (fundet af Claude)
let events = null, evFilter = "Alle", evPoll = null;
let evStars = store.get("evStars", {});   // { url: {title,date,time,city} }
const AARHUS = /aarhus|århus/i;
const WEEKDAY = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
const MONTH = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const evDate = (e) => new Date(e.date + "T" + (/^\d\d:\d\d/.test(e.time || "") ? e.time.slice(0, 5) : "12:00"));
const daysUntil = (e) => Math.round((new Date(e.date + "T00:00") - new Date(today() + "T00:00")) / 864e5);
const whenTxt = (n) => n === 0 ? "i dag" : n === 1 ? "i morgen" : `om ${n} dage`;

function gcalLink(e) {
  const d = evDate(e), pad = (n) => String(n).padStart(2, "0");
  const fmt = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const end = new Date(d.getTime() + 2 * 3600e3);
  const dates = /^\d\d:\d\d/.test(e.time || "") ? `${fmt(d)}/${fmt(end)}` : `${e.date.replace(/-/g, "")}/${e.date.replace(/-/g, "")}`;
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, details: `${e.why}\n\n${e.url}`, location: e.online ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") });
  return "https://calendar.google.com/calendar/render?" + p;
}

async function eventsLoad(force) {
  const el = $("#ai-events");
  if (!events) el.innerHTML = `<div class="loading">Henter events…</div>`;
  try {
    if (force) await api("/api/events/refresh", { method: "POST" });
    events = await api("/api/events");
    renderEvents();
    clearTimeout(evPoll);
    if (events.refreshing) evPoll = setTimeout(eventsLoad, 8000);
  } catch (err) { el.innerHTML = `<div class="err">${esc(err.message)}</div>`; }
}

function renderEvents() {
  const el = $("#ai-events"), E = events;
  const list = E.events.filter((e) => evFilter === "Alle" ? true : evFilter === "Aarhus" ? AARHUS.test(e.city) && !e.online
    : evFilter === "Danmark" ? !e.online : evFilter === "Online" ? e.online : !!evStars[e.url]);
  const age = E.updated ? fmtAgo(E.updated) : "aldrig";
  let html = `
    <div class="ev-head">
      <div><b>AI-events</b><span class="muted">${E.refreshing ? "Claude søger nettet… (ca. 2 min)" : `Fundet af Claude · opdateret ${age}`}</span></div>
      <button class="icon ${E.refreshing ? "spin" : ""}" id="ev-refresh" title="Søg igen" ${E.refreshing ? "disabled" : ""}>${ic("refresh")}</button>
    </div>
    ${E.error ? `<div class="err">Søgningen fejlede: ${esc(E.error)}</div>` : ""}
    <div class="chips">${["Alle", "Aarhus", "Danmark", "Online", "Mine"].map((f) => `<button class="chip ${f === evFilter ? "on" : ""}" data-f="${f}">${f}</button>`).join("")}</div>`;
  if (!list.length) {
    html += `<div class="empty">${E.refreshing && !E.events.length ? "Første søgning kører – kom tilbage om et par minutter." : evFilter === "Mine" ? "Tryk Gem på et event for at gemme det her." : "Ingen events i denne kategori lige nu."}</div>`;
  } else {
    let lastMonth = "";
    for (const e of list) {
      const d = new Date(e.date + "T00:00"), m = MONTH[d.getMonth()] + " " + d.getFullYear(), n = daysUntil(e), star = !!evStars[e.url];
      if (m !== lastMonth) { html += `<h2 class="sub">${m}</h2>`; lastMonth = m; }
      html += `<article class="event ${star ? "starred" : ""}">
        <div class="ev-date"><span>${WEEKDAY[d.getDay()]}</span><b>${d.getDate()}</b><span>${MONTH[d.getMonth()]}</span></div>
        <div class="ev-body">
          <div class="meta"><span class="tag ev-kind">${esc(e.kind)}</span>${esc(e.online ? "Online" : e.city)}${e.time ? " · " + esc(e.time) : ""} · <span class="${n <= 7 ? "soon" : ""}">${whenTxt(n)}</span></div>
          <h3>${esc(e.title)}</h3>
          <p class="muted">${esc(e.organizer)}${e.venue ? " · " + esc(e.venue) : ""}${e.price ? " · " + esc(e.price) : ""}</p>
          <p>${esc(e.why)}</p>
          <div class="ev-actions">
            <button class="btn ghost sm ev-star" data-u="${esc(e.url)}">${ic("bookmark")}${star ? "Gemt" : "Gem"}</button>
            <a class="btn ghost sm" href="${esc(gcalLink(e))}" target="_blank" rel="noopener">${ic("calendar")}Kalender</a>
            <a class="btn sm" href="${esc(e.url)}" target="_blank" rel="noopener">Tilmeld ${ic("right")}</a>
          </div>
        </div></article>`;
    }
  }
  html += `<p class="muted center-txt">Claude søger automatisk igen hver 3. dag via dit Claude-abonnement. Alle links er tjekket – events med døde links eller forkerte datoer smides væk.</p>`;
  el.innerHTML = html;
  $("#ev-refresh").onclick = () => eventsLoad(true);
  el.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => { evFilter = b.dataset.f; renderEvents(); });
  el.querySelectorAll(".ev-star").forEach((b) => b.onclick = () => {
    const e = E.events.find((x) => x.url === b.dataset.u);
    if (evStars[e.url]) delete evStars[e.url]; else evStars[e.url] = { title: e.title, date: e.date, time: e.time || "", city: e.online ? "Online" : e.city, url: e.url };
    store.set("evStars", evStars);
    renderEvents();
  });
}

// Lille påmindelse på forsiden om næste gemte event
function nextStarredEvent() {
  return Object.values(evStars).filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
}

// ================================================================== LAGER
const fmtBytes = (b) => b > 1e9 ? (b / 1e9).toFixed(1) + " GB" : b > 1e6 ? Math.round(b / 1e6) + " MB" : Math.round(b / 1e3) + " KB";
$("#btn-storage").onclick = async () => {
  const dlg = $("#storage-dlg");
  dlg.showModal();
  $("#storage-info").textContent = "Tjekker…";
  try {
    const s = await api("/api/storage");
    $("#storage-info").innerHTML = s.dirs.length ? `Gamle downloads fylder <b>${fmtBytes(s.total)}</b>` + s.dirs.map((d) => `<br><span class="muted">${esc(d.path)}: ${fmtBytes(d.bytes)}</span>`).join("") : "Ingen gamle downloads fundet.";
  } catch (err) { $("#storage-info").textContent = err.message; }
};
$("#storage-close").onclick = () => $("#storage-dlg").close();
$("#storage-clear").onclick = async () => {
  if (!confirm("Slet alle gamle downloads og YouTube-historik? Det kan ikke fortrydes.")) return;
  try {
    const r = await api("/api/storage/clear", { method: "POST" });
    ytHistory = []; store.set("ytHistory", []); podPos = {}; store.set("podPos", {});
    $("#storage-info").textContent = `Ryddet – ${fmtBytes(r.freed)} frigjort.`;
  } catch (err) { $("#storage-info").textContent = err.message; }
};

// ------------------------------------------------------------------ start
renderPills();
renderLearn();
showTab(store.get("tab", "learn"));
