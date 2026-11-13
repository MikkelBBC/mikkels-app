/* Dyret "Bit", daglige missioner og achievements.
   Alt er faste regler: samme indsats giver samme belønning. Ingen tilfældige belønninger. */
"use strict";

const MISSION_XP = 15, ALL_MISSIONS_XP = 25, ACH_XP = 25;

// ------------------------------------------------------------------ statistik
const lifetime = Object.assign({ correct: 0, ideas: 0, lessons: 0, perfect: 0, maxCombo: 0, missions: 0, bestStreak: 0, reviews: 0 }, store.get("stats", {}));
function dayStats() {
  const d = store.get("dstats", null);
  return d && d.day === today() ? d : { day: today(), correct: 0, ideas: 0, lessons: 0, perfect: 0, maxCombo: 0, reviews: 0, xp: 0, done: [], allDone: false };
}
let dstats = dayStats();
let unlocked = store.get("ach", {});
function saveStats() { store.set("stats", lifetime); store.set("dstats", dstats); store.set("ach", unlocked); }

// ------------------------------------------------------------------ missioner (3 pr. dag, valgt ud fra datoen)
const MISSIONS = [
  { id: "correct", text: (n) => `Svar rigtigt på ${n} spørgsmål`, n: 10, v: (d) => d.correct },
  { id: "ideas", text: (n) => `Læs ${n} idéer i Udforsk`, n: 5, v: (d) => d.ideas },
  { id: "lesson", text: () => "Gennemfør en lektion", n: 1, v: (d) => d.lessons },
  { id: "combo", text: (n) => `Få en combo på ${n} i træk`, n: 5, v: (d) => d.maxCombo },
  { id: "perfect", text: () => "Få 3 stjerner i en lektion", n: 1, v: (d) => d.perfect },
  { id: "xp", text: (n) => `Tjen ${n} XP i dag`, n: 80, v: (d) => d.xp },
  { id: "ideas2", text: (n) => `Forstå ${n} idéer i Udforsk`, n: 10, v: (d) => d.ideas },
];
function todaysMissions() {
  let h = 0;
  for (const ch of today()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = MISSIONS.slice(), out = [];
  while (out.length < 3) { const i = h % pool.length; out.push(pool.splice(i, 1)[0]); h = Math.floor(h / 7) + 13; }
  return out;
}

// ------------------------------------------------------------------ achievements
const doneAll = (cid) => { const c = COURSES.find((x) => x.id === cid); return c && c.units.every((u) => unitStars(cid, u.id) > 0); };
const ACHIEVEMENTS = [
  { id: "first", name: "Første skridt", desc: "Gennemfør din første lektion", icon: "play", ok: () => lifetime.lessons >= 1 },
  { id: "c50", name: "Varm i trøjen", desc: "50 rigtige svar", icon: "check", ok: () => lifetime.correct >= 50 },
  { id: "c250", name: "Maskinen", desc: "250 rigtige svar", icon: "zap", ok: () => lifetime.correct >= 250 },
  { id: "c1000", name: "Eksamensklar", desc: "1.000 rigtige svar", icon: "trophy", ok: () => lifetime.correct >= 1000 },
  { id: "combo10", name: "Ustoppelig", desc: "Combo på 10 i træk", icon: "flame", ok: () => lifetime.maxCombo >= 10 },
  { id: "s3", name: "Tre dage", desc: "Streak på 3 dage", icon: "flame", ok: () => lifetime.bestStreak >= 3 },
  { id: "s7", name: "En hel uge", desc: "Streak på 7 dage", icon: "calendar", ok: () => lifetime.bestStreak >= 7 },
  { id: "s30", name: "Vane", desc: "Streak på 30 dage", icon: "trophy", ok: () => lifetime.bestStreak >= 30 },
  { id: "p5", name: "Perfektionist", desc: "3 stjerner i 5 lektioner", icon: "star", ok: () => lifetime.perfect >= 5 },
  { id: "i10", name: "Nysgerrig", desc: "Forstå 10 idéer i Udforsk", icon: "bulb", ok: () => Object.keys(exDone).length >= 10 },
  { id: "iall", name: "Polyhistor", desc: "Forstå alle idéer i Udforsk", icon: "compass", ok: () => Object.keys(exDone).length >= CONCEPTS.length },
  { id: "m10", name: "Pålidelig", desc: "Klar 10 daglige missioner", icon: "check", ok: () => lifetime.missions >= 10 },
  { id: "l5", name: "Niveau 5", desc: "Nå niveau 5", icon: "star", ok: () => game.level() >= 5 },
  { id: "l10", name: "Niveau 10", desc: "Nå niveau 10", icon: "trophy", ok: () => game.level() >= 10 },
  { id: "doa", name: "DOA gennemført", desc: "Bestå alle DOA-enheder", icon: "branch", ok: () => doneAll("doa") },
  { id: "sys", name: "SYS gennemført", desc: "Bestå alle SYS-enheder", icon: "terminal", ok: () => doneAll("sys") },
];

// ------------------------------------------------------------------ dyret Bit
const STAGES = [
  { min: 1, name: "Æg", next: 3 }, { min: 3, name: "Unge", next: 6 },
  { min: 6, name: "Lærling", next: 10 }, { min: 10, name: "Mester", next: null },
];
function petStage() { const l = game.level(); return STAGES.filter((s) => l >= s.min).pop(); }
function petMood() {
  if (dstats.xp === 0) return "sleepy";
  return game.daily.day === today() && game.daily.xp >= DAILY_GOAL ? "happy" : "ok";
}
function petSvg(stage = petStage().name, mood = petMood()) {
  if (stage === "Æg") {
    return `<svg viewBox="0 0 100 100" class="pet egg"><ellipse cx="50" cy="56" rx="30" ry="36" fill="#e8e3ff"/>
      <path d="M26 54l8-6 8 6 8-6 8 6 8-6 8 6" fill="none" stroke="#7c86ff" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="38" rx="6" ry="9" fill="#fff" opacity=".6"/></svg>`;
  }
  const s = { Unge: 0.78, Lærling: 0.9, Mester: 1 }[stage];
  const eyes = mood === "sleepy" ? `<path d="M37 50q5 4 10 0M53 50q5 4 10 0" stroke="#14161c" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<circle cx="42" cy="49" r="4.5" fill="#14161c"/><circle cx="58" cy="49" r="4.5" fill="#14161c"/><circle cx="43.5" cy="47.5" r="1.4" fill="#fff"/><circle cx="59.5" cy="47.5" r="1.4" fill="#fff"/>`;
  const mouth = mood === "happy" ? `<path d="M43 60q7 7 14 0" stroke="#14161c" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : mood === "sleepy" ? `<circle cx="50" cy="61" r="2.5" fill="#14161c"/>` : `<path d="M45 61q5 3 10 0" stroke="#14161c" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const extra = stage === "Mester" ? `<path d="M36 22l6 8 8-11 8 11 6-8-3 14H39z" fill="#fbbf24" stroke="#b7791f" stroke-width="1.5" stroke-linejoin="round"/>`
    : stage === "Lærling" ? `<path d="M30 30l20-9 20 9-20 9z" fill="#14161c"/><path d="M66 32v8" stroke="#14161c" stroke-width="2"/>` : "";
  return `<svg viewBox="0 0 100 100" class="pet ${mood}"><g transform="translate(50 60) scale(${s}) translate(-50 -60)">
    <path d="M22 60c0-20 12-34 28-34s28 14 28 34-10 28-28 28-28-8-28-28z" fill="#7c86ff"/>
    <path d="M30 40l-6-12 14 6M70 40l6-12-14 6" fill="#7c86ff"/>
    <ellipse cx="50" cy="70" rx="16" ry="12" fill="#a5abff" opacity=".55"/>
    <circle cx="35" cy="58" r="4" fill="#f472b6" opacity=".45"/><circle cx="65" cy="58" r="4" fill="#f472b6" opacity=".45"/>
    ${eyes}${mouth}</g>${extra}</svg>`;
}
const MOOD_TXT = { sleepy: "Bit sover. Lær lidt for at vække den.", ok: "Bit er vågen – nå dagens mål for at gøre den glad.", happy: "Bit er glad. Dagens mål er nået." };

function petCard() {
  const st = petStage(), lvl = game.level(), from = game.levelStart(lvl), to = game.levelStart(lvl + 1);
  const ms = todaysMissions(), achN = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return `<div class="pet-card">
    <div class="pet-top">
      <div class="pet-wrap">${petSvg()}</div>
      <div class="pet-info">
        <div class="pet-name"><b>Bit</b><span class="pet-stage">${st.name} · niv. ${lvl}</span></div>
        <span class="muted">${MOOD_TXT[petMood()]}</span>
        <div class="bar"><i style="width:${Math.round((game.xp - from) / (to - from) * 100)}%"></i></div>
        <span class="muted xs">${game.xp - from}/${to - from} XP til niv. ${lvl + 1}${st.next ? ` · udvikler sig ved niv. ${st.next}` : ""}</span>
      </div>
    </div>
    <div class="missions">
      <div class="m-head"><b>Dagens missioner</b><button class="link" id="ach-open">${ic("trophy")}${achN}/${ACHIEVEMENTS.length}</button></div>
      ${ms.map((m) => { const v = Math.min(m.n, m.v(dstats)), done = dstats.done.includes(m.id);
        return `<div class="mission ${done ? "done" : ""}"><span class="m-check">${done ? ic("check") : ""}</span>
          <div class="m-body"><span>${m.text(m.n)}</span><div class="bar thin"><i style="width:${v / m.n * 100}%"></i></div></div>
          <span class="m-xp">${done ? "Klaret" : `${v}/${m.n}`}</span></div>`; }).join("")}
      ${dstats.allDone ? `<div class="m-all">${ic("trophy")}Alle missioner klaret i dag · +${ALL_MISSIONS_XP} XP</div>` : `<div class="muted xs">+${MISSION_XP} XP pr. mission · +${ALL_MISSIONS_XP} XP når alle tre er klaret</div>`}
    </div>
  </div>`;
}

function openAchievements() {
  let dlg = $("#ach-dlg");
  if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "ach-dlg"; document.body.appendChild(dlg); }
  dlg.innerHTML = `<div class="ach-head"><h3>Achievements</h3><button class="icon" id="ach-close" aria-label="Luk">${ic("x")}</button></div>
    <p class="muted">+${ACH_XP} XP for hver. Bedste streak: ${lifetime.bestStreak} dage · ${lifetime.correct} rigtige svar i alt.</p>
    <div class="ach-grid">${ACHIEVEMENTS.map((a) => `<div class="ach ${unlocked[a.id] ? "on" : ""}"><span class="ach-ico">${ic(a.icon)}</span>
      <b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join("")}</div>`;
  dlg.showModal();
  $("#ach-close").onclick = () => dlg.close();
}
document.addEventListener("click", (e) => { if (e.target.closest("#ach-open")) openAchievements(); });

// ------------------------------------------------------------------ hændelser
let checking = false;
function checkProgress() {
  if (checking) return;      // belønninger kalder game.add, som kalder os igen
  checking = true;
  try {
    lifetime.bestStreak = Math.max(lifetime.bestStreak, game.streakAlive());
    const before = petStage().name;
    for (const m of todaysMissions()) {
      if (!dstats.done.includes(m.id) && m.v(dstats) >= m.n) {
        dstats.done.push(m.id); lifetime.missions++; saveStats();
        game.add(MISSION_XP); toast(`Mission klaret: ${m.text(m.n)} · +${MISSION_XP} XP`);
      }
    }
    if (!dstats.allDone && dstats.done.length >= 3) { dstats.allDone = true; saveStats(); game.add(ALL_MISSIONS_XP); setTimeout(() => toast(`Alle dagens missioner klaret · +${ALL_MISSIONS_XP} XP`), 1600); }
    for (const a of ACHIEVEMENTS) {
      if (!unlocked[a.id] && a.ok()) {
        unlocked[a.id] = today(); saveStats(); game.add(ACH_XP);
        setTimeout(() => toast(`Achievement: ${a.name} · +${ACH_XP} XP`), 900);
      }
    }
    if (petStage().name !== before) setTimeout(() => toast(`Bit har udviklet sig til ${petStage().name}!`), 2400);
    saveStats();
  } finally { checking = false; }
}

function track(type, data = {}) {
  if (dstats.day !== today()) dstats = dayStats();
  if (type === "correct") { dstats.correct++; lifetime.correct++; dstats.maxCombo = Math.max(dstats.maxCombo, data.combo || 0); lifetime.maxCombo = Math.max(lifetime.maxCombo, data.combo || 0); }
  if (type === "lesson") { dstats.lessons++; lifetime.lessons++; if (data.stars === 3) { dstats.perfect++; lifetime.perfect++; } }
  if (type === "review") { dstats.reviews++; lifetime.reviews++; }
  if (type === "idea" && data.ok) { dstats.ideas++; lifetime.ideas++; }
  saveStats();
  checkProgress();
  refreshPetCard();
}

function refreshPetCard() {
  const el = $(".pet-card");
  if (el) el.outerHTML = petCard();
}

// XP fra alle kilder tæller med i "Tjen XP i dag".
const _add = game.add.bind(game);
game.add = (n) => { if (dstats.day !== today()) dstats = dayStats(); dstats.xp += n; saveStats(); _add(n); checkProgress(); };

// Tegn Lær igen, nu hvor kortet findes.
if (currentTab === "learn" && !lesson) renderLearn();
