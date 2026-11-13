/* Profil: Bit, statistik, missioner, achievements, dækning og dine likes.
   Åbnes fra knappen med Bit i øverste hjørne. */
"use strict";

// ------------------------------------------------------------------ like / dislike
let votes = store.get("votes", {});           // id → 1 | -1
function vote(item, v) {
  const cur = votes[item.id] || 0, next = cur === v ? 0 : v;   // tryk igen = fortryd
  if (next) votes[item.id] = next; else delete votes[item.id];
  store.set("votes", votes);
  if (!STATIC_MODE) fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: item.id, vote: next, kind: item.kind, title: item.title, topic: item.topic }) }).catch(() => { /* offline: ligger stadig lokalt */ });
  return next;
}
function topicScore(t) {
  return CONCEPTS.reduce((s, c) => s + (c.t === t ? (votes[c.id] || 0) : 0), 0);
}

// Udforsk: skjul det du ikke kan lide, og vis mere af de emner du liker.
const _exPool = exPool;
exPool = function () {
  const list = _exPool().filter((c) => votes[c.id] !== -1);
  const unseen = list.filter((c) => !exDone[c.id]), seen = list.filter((c) => exDone[c.id]);
  const w = (c) => topicScore(c.t) * 0.5 + Math.random() + (votes[c.id] === 1 ? 0.3 : 0);
  return [...unseen.map((c) => [w(c), c]).sort((a, b) => b[0] - a[0]).map((x) => x[1]), ...seen];
};
const _exCard = exCard;
exCard = function (c) {
  const v = votes[c.id] || 0;
  return _exCard(c).replace('<button class="icon ghost ex-save',
    `<span class="votes"><button class="icon ghost vote up ${v === 1 ? "on" : ""}" data-v="1" aria-label="Synes godt om">${ic("thumbUp")}</button>` +
    `<button class="icon ghost vote down ${v === -1 ? "on" : ""}" data-v="-1" aria-label="Synes ikke om">${ic("thumbDown")}</button></span><button class="icon ghost ex-save`);
};
document.addEventListener("click", (e) => {
  const b = e.target.closest(".ex-card .vote");
  if (!b) return;
  const card = b.closest(".ex-card"), c = CONCEPTS.find((x) => x.id === card.dataset.id);
  const now = vote({ id: c.id, kind: "idé", title: c.title, topic: c.t }, +b.dataset.v);
  card.querySelectorAll(".vote").forEach((x) => x.classList.toggle("on", +x.dataset.v === now));
  if (now === 1) celebrate(b, "+1");
  if (now === -1) { card.classList.add("hiding"); toast("Du får færre af den slags"); setTimeout(() => card.remove(), 350); }
});

// ------------------------------------------------------------------ lille missionsbjælke i Lær og Udforsk
function missionStrip() {
  const ms = todaysMissions(), n = ms.filter((m) => dstats.done.includes(m.id)).length;
  return `<button class="m-strip" id="m-strip">
    <span class="m-strip-pet">${petSvg()}</span>
    <span class="m-strip-txt"><b>Dagens missioner ${n}/3</b><span class="muted">${n === 3 ? "Alle klaret i dag" : esc(ms.find((m) => !dstats.done.includes(m.id)).text(ms.find((m) => !dstats.done.includes(m.id)).n))}</span></span>
    <span class="m-dots">${ms.map((m) => `<i class="${dstats.done.includes(m.id) ? "on" : ""}"></i>`).join("")}</span>
    ${ic("chevron")}</button>`;
}
petCard = missionStrip;                    // Lær/Udforsk viser nu den lille bjælke
document.addEventListener("click", (e) => { if (e.target.closest("#m-strip, #btn-profile")) showTab("profile"); });

function refreshPetCard() {
  const s = $("#m-strip");
  if (s) s.outerHTML = missionStrip();
  paintProfileBtn();
  if (currentTab === "profile") renderProfile();
}

// ------------------------------------------------------------------ knap i hjørnet
function paintProfileBtn() {
  let b = $("#btn-profile");
  if (!b) {
    b = document.createElement("button");
    b.id = "btn-profile"; b.className = "icon profile-btn"; b.title = "Profil og statistik"; b.setAttribute("aria-label", "Profil og statistik");
    $(".top-right").prepend(b);
  }
  const n = todaysMissions().filter((m) => !dstats.done.includes(m.id)).length;
  b.innerHTML = petSvg() + (n ? `<span class="badge">${n}</span>` : "");
}

// ------------------------------------------------------------------ profilsiden
function renderProfile() {
  const el = $("#tab-profile");
  const st = petStage(), lvl = game.level(), from = game.levelStart(lvl), to = game.levelStart(lvl + 1);
  const ms = todaysMissions();
  const achN = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const known = Object.keys(exDone).length;
  const liked = Object.entries(votes).filter(([, v]) => v === 1).length, disliked = Object.entries(votes).filter(([, v]) => v === -1).length;
  const stat = (icon, v, l) => `<div class="stat">${ic(icon)}<b>${v}</b><span>${l}</span></div>`;
  const courseRow = (c) => {
    const passed = c.units.filter((u) => unitStars(c.id, u.id) > 0).length;
    const stars = c.units.reduce((s, u) => s + unitStars(c.id, u.id), 0);
    return `<div class="cov"><div class="cov-h">${ic(c.icon)}<b>${esc(c.full)}</b><span>${passed}/${c.units.length} enheder · ${stars}/${c.units.length * 3} stjerner</span></div>
      <div class="bar"><i style="width:${passed / c.units.length * 100}%"></i></div></div>`;
  };
  const topicRow = (t) => {
    const all = CONCEPTS.filter((c) => c.t === t.id), k = all.filter((c) => exDone[c.id]).length, sc = topicScore(t.id);
    return `<div class="cov small"><div class="cov-h">${ic(t.icon)}<b>${esc(t.name)}</b><span>${k}/${all.length}${sc > 0 ? ` · ${ic("thumbUp")}${sc}` : sc < 0 ? ` · ${ic("thumbDown")}${-sc}` : ""}</span></div>
      <div class="bar thin"><i style="width:${all.length ? k / all.length * 100 : 0}%"></i></div></div>`;
  };
  const stageIdx = STAGES.indexOf(st);
  el.innerHTML = `
    <div class="prof-hero">
      <div class="pet-wrap big">${petSvg()}</div>
      <h2>Bit</h2>
      <span class="pet-stage">${st.name} · niveau ${lvl}</span>
      <p class="muted">${MOOD_TXT[petMood()]}</p>
      <div class="evo">${STAGES.map((s, i) => `<div class="evo-step ${i <= stageIdx ? "on" : ""}"><span>${petSvg(s.name, "ok")}</span><small>${s.name}<br>niv. ${s.min}</small></div>`).join('<i class="evo-line"></i>')}</div>
      <div class="bar"><i style="width:${Math.round((game.xp - from) / (to - from) * 100)}%"></i></div>
      <span class="muted xs">${game.xp - from}/${to - from} XP til niveau ${lvl + 1}${st.next ? ` · Bit udvikler sig ved niveau ${st.next}` : " · fuldt udviklet"}</span>
    </div>

    <div class="stat-grid">
      ${stat("flame", game.streakAlive(), `dage i træk · bedste ${lifetime.bestStreak}`)}
      ${stat("star", game.xp, "XP i alt")}
      ${stat("check", lifetime.correct, "rigtige svar")}
      ${stat("cap", lifetime.lessons, "lektioner")}
      ${stat("bulb", `${known}/${CONCEPTS.length}`, "idéer forstået")}
      ${stat("trophy", `${achN}/${ACHIEVEMENTS.length}`, "achievements")}
    </div>

    <h3 class="sec">Dagens missioner</h3>
    <div class="card-list">${ms.map((m) => { const v = Math.min(m.n, m.v(dstats)), done = dstats.done.includes(m.id);
      return `<div class="mission ${done ? "done" : ""}"><span class="m-check">${done ? ic("check") : ""}</span>
        <div class="m-body"><span>${m.text(m.n)}</span><div class="bar thin"><i style="width:${v / m.n * 100}%"></i></div></div>
        <span class="m-xp">${done ? "Klaret" : `${v}/${m.n}`}</span></div>`; }).join("")}
      <div class="muted xs">+${MISSION_XP} XP pr. mission · +${ALL_MISSIONS_XP} XP når alle tre er klaret · ${lifetime.missions} missioner klaret i alt</div></div>

    <h3 class="sec">Fag og eksamen</h3>
    <div class="card-list">${COURSES.map(courseRow).join("")}</div>

    <h3 class="sec">Udforsk – emner du har dækket</h3>
    <div class="card-list">${TOPICS.map(topicRow).join("")}</div>

    <h3 class="sec">Achievements <span class="muted">${achN}/${ACHIEVEMENTS.length}</span></h3>
    <div class="ach-grid inline">${ACHIEVEMENTS.map((a) => `<div class="ach ${unlocked[a.id] ? "on" : ""}"><span class="ach-ico">${ic(a.icon)}</span>
      <b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join("")}</div>

    <h3 class="sec">Det du synes om</h3>
    <div class="card-list">
      <div class="likes">${ic("thumbUp")}<b>${liked}</b> liket · ${ic("thumbDown")}<b>${disliked}</b> disliket</div>
      <p class="muted xs">Tryk tommel op eller ned på kortene i Udforsk. Appen viser flere af de emner du liker, skjuler dem du disliker, og gemmer det også på serveren, så Claude kan se det, når appen skal forbedres.</p>
      ${Object.keys(votes).slice(-6).reverse().map((id) => { const c = CONCEPTS.find((x) => x.id === id); return c ? `<div class="like-row">${ic(votes[id] === 1 ? "thumbUp" : "thumbDown")}<span>${esc(c.title)}</span></div>` : ""; }).join("")}
    </div>`;
}

// ------------------------------------------------------------------ kobl ind i fanerne
const profSec = document.createElement("section");
profSec.id = "tab-profile"; profSec.className = "tab";
$("main").appendChild(profSec);
TITLES.profile = "Profil";
const _showTab = showTab;
showTab = function (name) {
  _showTab(name);
  if (name === "profile") renderProfile();
};
paintProfileBtn();
if (currentTab === "profile") showTab("profile");
else if (currentTab === "learn" && !lesson) renderLearn();
